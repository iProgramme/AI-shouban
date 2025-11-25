// utils/imageGeneration.js
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import getLocalizedTexts from './texts.js';
import { uploadToCos } from './cos.js';

/**
 * 生成图片的核心逻辑函数
 * @param {Object} params - 生成参数
 * @param {File[]} params.imageFiles - 图片文件数组
 * @param {string} params.promptFromFrontend - 前端传入的提示词
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImage(params) {
  const { imageFiles, promptFromFrontend } = params;

  // 检查是否为文生图模式（只有提示词，没有图片）
  const isTextToImage = promptFromFrontend && (!imageFiles || imageFiles.length === 0);

  // 处理图片文件（图生图模式）
  let imageBase64Array = [];
  let originalPublicPath = `/temp/original_${Date.now()}`; // 虚拟路径

  if (imageFiles && imageFiles.length > 0) {
    // 验证文件大小，不超过5MB
    for (const imageFile of imageFiles) {
      // 获取文件大小（获取buffer的大小）
      let originalFileSize;
      if (Buffer.isBuffer(imageFile)) {
        originalFileSize = imageFile.length;
      } else if (imageFile.buffer) {
        originalFileSize = imageFile.buffer.length;
      } else if (imageFile.size) {
        originalFileSize = imageFile.size;
      } else {
        // 最后尝试从filepath获取文件大小（理论上不应该执行到这里）
        originalFileSize = (await fs.stat(imageFile.filepath)).size;
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes

      if (originalFileSize > MAX_SIZE) {
        throw new Error('图片过大，请确保图片小于5MB后重新上传。当前文件大小: ' + (originalFileSize / (1024 * 1024)).toFixed(2) + 'MB');
      }

      // 从临时文件路径读取文件内容
      const imageBuffer = await fs.readFile(imageFile.filepath);
      const fileExtension = path.extname(imageFile.originalFilename || imageFile.newFilename || '') || 'jpg';
      const imageBase64 = imageBuffer.toString('base64');

      // 上传原图片到COS
      const originalFileName = `original_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExtension.replace('.', '')}`;
      originalPublicPath = await uploadToCos(imageBuffer, originalFileName, `image/${fileExtension.replace('.', '')}`);

      imageBase64Array.push({
        base64: imageBase64,
        extension: fileExtension.replace('.', '')
      });

      // 删除临时文件以避免留下垃圾文件
      try {
        await fs.unlink(imageFile.filepath);
      } catch (unlinkErr) {
        console.error('删除临时文件失败:', unlinkErr);
      }
    }
  } else {
    // 对于纯文本生成图片，设置虚拟路径
    originalPublicPath = `/temp/original_${Date.now()}`;
  }

  const API_TANGGUO_KEY = process.env.API_TANGGUO_KEY;
  if (!API_TANGGUO_KEY) {
    throw new Error('API_TANGGUO_KEY 未配置');
  }

  // 根据环境变量和前端传入的提示词确定实际的提示词
  const appType = process.env.APP_TYPE || 'default';
  let prompt;

  if (appType === 'default' && promptFromFrontend) {
    // 当APP_TYPE为default时，使用前端传入的提示词
    prompt = promptFromFrontend;
  } else {
    // 否则使用预设的提示词
    const selectedTexts = getLocalizedTexts();
    prompt = selectedTexts.imageGenerationPrompt;
  }

  if (!prompt) {
    throw new Error('未配置图片生成提示');
  }

  // 构建请求负载
  const requestPayload = {
    model: process.env.MODEL_NAME || "gemini-3-pro-image-preview", // 使用Gemini模型
    stream: false,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ]
  };

  // 如果是图生图模式，添加图片到内容中
  if (!isTextToImage && imageBase64Array.length > 0) {
    for (const imgData of imageBase64Array) {
      requestPayload.messages[0].content.push({
        type: "image_url",
        image_url: {
          url: `data:image/${imgData.extension};base64,${imgData.base64}`
        }
      });
    }
  };

  const API_TANGGUO_BASE_URL = process.env.API_TANGGUO_BASE_URL;
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TANGGUO_KEY}`
  };
  let fullContent = "";

  try {
    // Call the AI API with timeout
    const response = await axios.post(
      `${API_TANGGUO_BASE_URL}/chat/completions`,
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

    let finishReason = "";
    console.log('生图入参:', process.env.MODEL_NAME, prompt)
    console.log('data:', JSON.stringify(response.data))

    if ("choices" in response.data && response.data.choices.length > 0) {
      const choice = response.data.choices[0];
      finishReason = choice.finish_reason;

      if ("message" in choice && choice.message && "content" in choice.message) {
        fullContent = choice.message.content;
      } else {
        // 尝试其他可能的响应结构
        if ("message" in choice && choice.message) {
          // 如果message存在但没有content，检查是否有其他字段
          console.log('响应消息结构:', choice.message);
        }
      }
    }

    // 检查是否因内容过滤而被拒绝
    if (finishReason === 'content_filter') {
      throw new Error('请求被内容安全策略拒绝，请检查上传的图片内容是否符合规范');
    }

    if (!fullContent) {
      throw new Error('未找到生成的图片内容');
    }
  } catch (apiError) {
    console.error('AI API 调用失败:', apiError);

    // 检查错误类型
    if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
      throw new Error('请求超时，请稍后重试');
    } else if (apiError.code === 'ECONNRESET' || apiError.message.includes('socket hang up')) {
      throw new Error('连接中断，请稍后重试');
    } else {
      throw new Error('AI服务调用失败');
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
      imageUrl = `data:image/${base64Match[1]};base64,${base64Match[2]}`;
    }
  }

  if (!imageUrl) {
    throw new Error("响应中未包含有效的图片URL或base64数据");
  }

  let generatedPublicPath = imageUrl; // 初始化为API返回的URL或base64字符串

  // 如果是base64格式，则上传到OSS
  if (isBase64) {
    const base64Match = /data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)/.exec(imageUrl);
    if (base64Match) {
      const mimeType = base64Match[1];
      const base64Data = base64Match[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // 上传生成的图片到COS
      const generatedFileName = `generated_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${mimeType.split('/')[1] || 'png'}`;
      generatedPublicPath = await uploadToCos(imageBuffer, generatedFileName, `image/${mimeType}`);
    }
  }
  // 如果返回的是外部URL，可以考虑下载后上传到OSS（可选）
  // 这里暂时保持原URL，但您可以根据需要决定是否要将外部URL图片也转存到OSS

  return {
    generatedPublicPath,
    originalPublicPath,
    isSuccessful: true
  };
}