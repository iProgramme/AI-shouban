import { verifyRedemptionCode, useRedemptionCode, saveGeneratedImage, saveGenerationResult } from '../../utils/db';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { getLocalizedTexts } from '../../utils/texts.js';
// Prepare for AI image generation
const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_BASE_URL = process.env.NANO_BANANA_BASE_URL;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
    responseTimeout: 100000, // 100秒响应超时
    maxDuration: 100, // 100秒最大执行时间
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    // Import formidable within the handler function for server-side compatibility
    const formidable = (await import('formidable')).default;

    // Parse the form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      uploadDir: path.join(process.cwd(), 'public/uploads'),
      keepExtensions: true
    });

    // Ensure upload directory exists
    await fs.mkdir(form.uploadDir, { recursive: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    const code = Array.isArray(fields.code) ? fields.code[0] : fields.code;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!code) {
      return res.status(400).json({ message: '请提供兑换码' });
    }

    if (!imageFile) {
      return res.status(400).json({ message: '请提供图片文件' });
    }

    // Verify the redemption code
    const verificationResult = await verifyRedemptionCode(code);
    if (!verificationResult.valid) {
      console.error('Redemption code verification failed:', verificationResult.error);
      // 即使验证失败也要记录到数据库
      try {
        await saveGenerationResult(
          `/temp/original_${Date.now()}`, // 虚拟原始图片路径
          JSON.stringify({ error: 'Redemption code verification failed' }),
          verificationResult.userId || null, // 使用验证结果中的用户ID，如果验证失败则为null
          verificationResult.id || null, // 使用验证结果中的兑换码ID，如果验证失败则为null
          'failed',
          verificationResult.error // 错误消息
        );
      } catch (dbError) {
        console.error('保存验证失败结果到数据库错误:', dbError);
      }
      return res.status(400).json({ message: verificationResult.error });
    }

    // 检查是否已达到使用次数上限
    if (verificationResult.usedCount >= verificationResult.usageCount) {
      // 记录使用次数已达上限的失败情况
      try {
        await saveGenerationResult(
          `/temp/original_${Date.now()}`, // 虚拟原始图片路径
          JSON.stringify({ error: 'Redemption code usage limit reached' }),
          verificationResult.userId,
          verificationResult.id,
          'failed',
          '兑换码使用次数已达上限'
        );
      } catch (dbError) {
        console.error('保存使用次数超限结果到数据库错误:', dbError);
      }
      return res.status(400).json({ message: '兑换码使用次数已达上限' });
    }

    // 验證文件大小，不超過5MB
    const originalFileSize = (await fs.stat(imageFile.filepath)).size;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    if (originalFileSize > MAX_SIZE) {
      return res.status(400).json({
        message: '图片过大，请确保图片小于5MB后重新上传。当前文件大小: ' + (originalFileSize / (1024 * 1024)).toFixed(2) + 'MB',
        fileSize: originalFileSize,
        maxSize: MAX_SIZE
      });
    }

    // 直接讀取圖片內容而不保存到服務器
    const fileExtension = path.extname(imageFile.originalFilename);
    const timestamp = Date.now();
    const originalPublicPath = `/temp/original_${timestamp}`; // 虛擬路徑，實際不保存


    if (!NANO_BANANA_API_KEY) {
      return res.status(500).json({ message: 'API密钥未配置' });
    }

    // Get image as base64 for prompt (directly from uploaded file)
    const imageBuffer = await fs.readFile(imageFile.filepath);
    const imageBase64 = imageBuffer.toString('base64');

    // Create a prompt using the image

    // 动态导入 texts 模块
    const selectedTexts = getLocalizedTexts();
    console.log("selectedTexts:", JSON.stringify(selectedTexts.imageGenerationPrompt));

    const prompt = selectedTexts.imageGenerationPrompt;

    if (!prompt) {
      return res.status(500).json({ message: '未配置图片生成提示' });
    }

    const requestPayload = {
      model: process.env.MODEL_NAME || "gemini-2.5-flash-image-preview", // 使用Gemini模型
      stream: false,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${fileExtension.replace('.', '')};base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NANO_BANANA_API_KEY}`
    };

    try {
      // Call the AI API with timeout
      const response = await axios.post(
        `${NANO_BANANA_BASE_URL}/chat/completions`,
        requestPayload,
        {
          headers: requestHeaders,
          timeout: 120000, // 120秒超时
          maxRedirects: 0, // 避免重定向
          // 配置适当地理TCP设置
          httpAgent: false,
          httpsAgent: false,
        }
      );

      // 检查API响应是否包含错误
      if (response.data.error) {
        throw new Error(`AI API 错误: ${response.data.error.message || '未知错误'}`);
      }

      let fullContent = "";
      let finishReason = "";
      console.log('生图入参:', process.env.MODEL_NAME, prompt)
      console.log('data:', JSON.stringify(response.data))

      if ("choices" in response.data && response.data.choices.length > 0) {
        const choice = response.data.choices[0];
        finishReason = choice.finish_reason;

        if ("message" in choice && "content" in choice.message) {
          fullContent = choice.message.content;
        }
      }

      // 检查是否因内容过滤而被拒绝
      if (finishReason === 'content_filter') {
        throw new Error('请求被内容安全策略拒绝，请检查上传的图片内容是否符合规范');
      }

      if (!fullContent) {
        return res.status(500).json({
          message: '未找到生成的图片内容',
          debugInfo: JSON.stringify(response.data).substring(0, 200),
          finishReason: finishReason
        });
      }
    } catch (apiError) {
      console.error('AI API 调用失败:', apiError);

      // 检查错误类型
      if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
        return res.status(408).json({
          message: '请求超时，请稍后重试',
          error: 'API调用超时'
        });
      } else if (apiError.code === 'ECONNRESET' || apiError.message.includes('socket hang up')) {
        return res.status(504).json({
          message: '连接中断，请稍后重试',
          error: '连接被远程服务器中断'
        });
      } else {
        return res.status(500).json({
          message: 'AI服务调用失败',
          error: apiError.message
        });
      }
    }

    // Parse the response to extract image data
    let imageUrl = null;
    let isBase64 = false;

    // First try to find markdown image link
    const markdownPattern = /!\[.*?\]\((https?:\/\/[^)]+)\)/;
    const urlMatch = markdownPattern.exec(fullContent);
    if (urlMatch && urlMatch[1]) {
      imageUrl = urlMatch[1];
    } else {
      // Then try to find base64 image data
      const base64Pattern = /data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)/;
      const base64Match = base64Pattern.exec(fullContent);
      if (base64Match) {
        isBase64 = true;
        imageUrl = `data:image/${base64Match[1]};base64,${base64Match[2]}`; // 默认使用png，可根据需要调整
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        message: "响应中未包含有效的图片URL或base64数据",
        debugInfo: fullContent.substring(0, 200)
      });
    }

    let generatedPublicPath = imageUrl; // 直接使用API返回的URL或base64字符串

    // 只有在圖片生成成功後才標記兌換碼為已使用
    await useRedemptionCode(verificationResult.id);
 
    // 保存成功的生成結果
    await saveGenerationResult(
      originalPublicPath,
      generatedPublicPath,
      verificationResult.userId,
      verificationResult.id,
      'success'
    );

    res.status(200).json({
      message: '图片生成成功',
      generatedImageUrl: generatedPublicPath,
      originalImageUrl: `/temp/original_${Date.now()}` // 虚拟路径
    });
  } catch (error) {
    console.error('AI图片生成错误:', error);

    // 保存失败的生成结果到数据库
    const errorDetail = {
      message: error.message,
      responseError: error.response ? error.response.data : null,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    try {
      await saveGenerationResult(
        `/temp/original_${Date.now()}`, // 虚拟原始图片路径
        JSON.stringify(errorDetail), // 将错误详情保存到生成图片字段
        verificationResult.userId,
        verificationResult.id,
        'failed',
        error.message // 错误消息保存到专用字段
      );
    } catch (dbError) {
      console.error('保存失败结果到数据库错误:', dbError);
    }

    // 如果是API调用错误或其他导致图片未成功生成的错误，
    // 不要扣除兑换码使用次数
    if (error.message &&
      (error.message.includes('API调用失败') ||
        error.message.includes('请求超时') ||
        error.message.includes('连接中断'))) {
      console.log('图片生成失败，兑换码未扣除');
    } else {
      // 如果是其他类型的错误（例如验证错误），仍然扣除兑换码
      // 但在我们的实现中，真正的API错误发生前验证已通过
      // 所以这里我们仍然不扣除兑换码，因为实际生成失败了
      try {
        // 如果因为错误而已经扣除了兑换码，这里可以考虑回滚
        // 但这需要更复杂的逻辑来跟踪状态
      } catch (rollbackError) {
        console.error('回滚兑换码使用失败:', rollbackError);
      }
    }

    res.status(500).json({
      message: '图片生成失败',
      error: error.message,
      ...(error.response ? { responseError: error.response.data } : {})
    });
  }
}