import { verifyRedemptionCode, useRedemptionCode, saveGeneratedImage } from '../../utils/db';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
// Prepare for AI image generation
const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_BASE_URL = process.env.NANO_BANANA_BASE_URL;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
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
      return res.status(400).json({ message: verificationResult.error });
    }

    // 检查是否已达到使用次数上限
    if (verificationResult.usedCount >= verificationResult.usageCount) {
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
    // 使用默认文本配置，也可以根据环境变量选择不同的配置
    const appType = process.env.APP_TYPE || 'default';
    const texts = require('../../utils/texts');
    let selectedTexts;

    switch(appType) {
      case 'ink':
        selectedTexts = texts.inkPaintingTexts;
        break;
      case '3d':
        selectedTexts = texts.threeDTexts;
        break;
      case 'default':
      default:
        selectedTexts = texts.defaultTexts;
    }

    const prompt = process.env.IMAGE_GENERATION_PROMPT || selectedTexts.imageGenerationPrompt;

    const requestPayload = {
      model: process.env.MODEL_NAME || "gpt-4o-mini", // Using a default model, can be configured
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

    // Call the AI API
    const response = await axios.post(
      `${NANO_BANANA_BASE_URL}/chat/completions`,
      requestPayload,
      { headers: requestHeaders }
    );

    let fullContent = "";
    if ("choices" in response.data && response.data.choices.length > 0) {
      const choice = response.data.choices[0];
      if ("message" in choice && "content" in choice.message) {
        fullContent = choice.message.content;
      }
    }

    if (!fullContent) {
      return res.status(500).json({
        message: '未找到生成的图片内容',
        debugInfo: JSON.stringify(response.data).substring(0, 200)
      });
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
        imageUrl = `data:image/${base64Match[1]};base64,${base64Match[2]}`;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        message: "响应中未包含有效的图片URL或base64数据",
        debugInfo: fullContent.substring(0, 200)
      });
    }

    let generatedPublicPath = imageUrl; // 直接使用API返回的URL或base64字符串

    // Mark the redemption code as used (increment usage count)
    await useRedemptionCode(verificationResult.id);

    // Save the generated image record (using virtual paths)
    await saveGeneratedImage(
      originalPublicPath,
      generatedPublicPath,
      verificationResult.userId,
      verificationResult.id
    );

    res.status(200).json({
      message: '图片生成成功',
      generatedImageUrl: generatedPublicPath,
      originalImageUrl: `/temp/original_${Date.now()}` // 虚拟路径
    });
  } catch (error) {
    console.error('AI图片生成错误:', error);
    res.status(500).json({
      message: '图片生成失败',
      error: error.message,
      ...(error.response ? { responseError: error.response.data } : {})
    });
  }
}