// utils/imageGenerationV2.js
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import http from 'http';
import https from 'https';
import getLocalizedTexts from './texts.js';
import { uploadImage } from './upload.js';

/**
 * 异步保存图片到本地
 * @param {Buffer} imageBuffer - 图片Buffer
 * @param {string} imageExtension - 图片扩展名
 * @returns {Promise<string>} 本地保存路径
 */
async function saveImageLocally(imageBuffer, imageExtension) {
  try {
    // 确保public/images/generated目录存在
    const localDir = path.join(process.cwd(), 'public', 'images', 'generated');

    // 在Next.js环境中，我们可能需要使用不同的路径策略
    // 对于服务端代码，使用相对路径或环境定义的路径
    await fs.mkdir(localDir, { recursive: true });

    // 生成唯一文件名
    const fileName = `local_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${imageExtension}`;
    const localPath = path.join(localDir, fileName);

    // 异步保存图片到本地
    await fs.writeFile(localPath, imageBuffer);

    // 返回相对路径，供Next.js访问
    return path.join('/images', 'generated', fileName);
  } catch (error) {
    console.error('保存图片到本地失败:', error);
    // 即使本地保存失败，也不应该影响主要的生成流程
    return null;
  }
}

/**
 * 使用Google Gemini API的新版图片生成函数 - 支持i2i和t2i模式
 * @param {Object} params - 生成参数
 * @param {File[]} params.imageFiles - 图片文件数组（可选，如果不提供则为t2i模式）
 * @param {string} params.code - 兑换码
 * @param {string} params.promptFromFrontend - 前端传入的提示词
 * @param {Object} params.verificationResult - 兑换码验证结果
 * @param {string} params.resolution - 分辨率，默认2K
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImageV2(params) {
  const {
    imageFiles,
    code,
    promptFromFrontend,
    verificationResult,
    resolution = "2K"
  } = params;

  // 固定纵横比为1:1，隐藏该参数
  const aspectRatio = "1:1";

  // 支持的纵横比
  const SUPPORTED_ASPECT_RATIOS = [
    "21:9", "16:9", "4:3", "3:2", "1:1", "9:16", "3:4", "2:3", "5:4", "4:5"
  ];

  // 验证纵横比
  if (aspectRatio && !SUPPORTED_ASPECT_RATIOS.includes(aspectRatio)) {
    throw new Error(`不支持的纵横比 ${aspectRatio}。支持: ${SUPPORTED_ASPECT_RATIOS.join(', ')}`);
  }

  // 检查是否为文生图模式（只有提示词，没有图片）
  const isTextToImage = promptFromFrontend && (!imageFiles || imageFiles.length === 0);

  // 如果不是文生图模式，且没有图片文件，返回错误
  if (!isTextToImage && (!imageFiles || imageFiles.length === 0)) {
    throw new Error('请提供图片文件');
  }

  // 检查是否已达到使用次数上限
  if (verificationResult.usedCount >= verificationResult.usageCount) {
    throw new Error('兑换码使用次数已达上限');
  }

  // 处理图片文件（i2i模式）
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

      // 上传原图片到指定存储
      const originalFileName = `original_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExtension.replace('.', '')}`;
      console.log("开始上传原图片到指定存储", originalFileName)
      originalPublicPath = await uploadImage(imageBuffer, originalFileName, 'original', `image/${fileExtension.replace('.', '')}`);
      console.log("原图片上传成功", originalPublicPath)
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

  const API_YI_KEY = process.env.API_YI_KEY;
  if (!API_YI_KEY) {
    throw new Error('API_YI_KEY 未配置');
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

  // 构建请求数据 - Google Gemini API格式
  let payload = {
    contents: [{
      parts: [
        { text: prompt }
      ]
    }]
  };

  // 如果是i2i模式，添加图片到内容中
  if (!isTextToImage && imageBase64Array.length > 0) {
    // 目前API易可能不完全支持URL方式，为确保兼容性，暂时使用内联base64数据
    // 即使图片已上传到Imgur，我们仍然将原始图片数据以内联方式发送到API易
    for (const imgData of imageBase64Array) {
      payload.contents[0].parts.push({
        inline_data: {
          mime_type: `image/${imgData.extension}`,
          data: imgData.base64
        }
      });
    }
  }

  // 添加生成配置，支持纵横比和分辨率
  payload.generationConfig = {
    responseModalities: ["IMAGE"],
    imageConfig: {
      // aspectRatio: aspectRatio,
      image_size: resolution
    }
  };

  // 使用Google Gemini API的generateContent端点
  const API_YI_URL = process.env.API_YI_URL || "https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent";
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_YI_KEY}`
  };

  let outputImageBase64 = null;

  try {
    // Call the Gemini API with timeout
    const timeoutValue = 10 * 60 *1000;

    console.log('Gemini API 调用开始，请求参数:', { resolution, prompt, API_YI_URL, "payload.contents[0].parts":JSON.stringify(payload.contents[0].parts) });

    // 创建自定义的axios实例，用于处理大响应
    const axiosInstance = axios.create({
      timeout: timeoutValue,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      responseType: 'stream',
      headers: requestHeaders,
      // 配置代理以更好地处理大数据
      httpAgent: new http.Agent({
        keepAlive: true,
        maxSockets: 1, // 进一步减少并发
        timeout: timeoutValue,
        freeSocketTimeout: 300000 // 5分钟空闲socket超时
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: 1, // 进一步减少并发
        timeout: timeoutValue,
        freeSocketTimeout: 300000 // 5分钟空闲socket超时
      }),
    });

    const response = await axiosInstance.post(API_YI_URL, payload);

    // 将流式响应转换为JSON，使用缓冲区以处理大数据
    let responseData = '';
    const buffer = [];

    for await (const chunk of response.data) {
      buffer.push(chunk);

      // 如果累积的数据大小过大，及时处理以避免内存问题
      if (buffer.length > 1000) { // 每1000个块进行一次处理
        responseData += Buffer.concat(buffer).toString();
        buffer.length = 0; // 清空缓冲区
      }
    }

    // 处理剩余的缓冲区数据
    if (buffer.length > 0) {
      responseData += Buffer.concat(buffer).toString();
    }

    // 解析JSON响应
    const parsedResponse = JSON.parse(responseData);

    // 将解析后的响应赋值给response对象，保持原有逻辑
    response.data = parsedResponse;

    console.log('Gemini API 调用成功，返回结果:', { resolution, prompt, API_YI_URL });

    if (response.data.error) {
      throw new Error(`Gemini API 错误: ${response.data.error.message || '未知错误'}`);
    }

    // 解析响应 - 查找图片数据
    if ("candidates" in response.data && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const parts = candidate.content.parts;
        for (const part of parts) {
          // 检查内联图片数据（base64格式）
          if (part.inlineData && part.inlineData.data) {
            outputImageBase64 = part.inlineData.data;
            break;
          } else if (part.inline_data && part.inline_data.data) {
            outputImageBase64 = part.inline_data.data;
            break;
          }
        }
      }
    }

    if (!outputImageBase64) {
      throw new Error("响应中未找到图片数据，响应结构: " + JSON.stringify(response.data).substring(0, 300));
    }
  } catch (apiError) {
    console.log("Gemini API 调用失败,api报错:",apiError)
    // 检查错误类型，如果响应中包含图片数据，仍然尝试保存
    if (apiError.response && apiError.response.data) {
      isFromError = true; // 标记这是从错误响应中获取的数据
      console.log('尝试从错误响应中解析图片数据，响应大小:', JSON.stringify(apiError.response.data).length);

      // 检查响应中是否包含图片数据
      if ("candidates" in apiError.response.data && apiError.response.data.candidates.length > 0) {
        const candidate = apiError.response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const parts = candidate.content.parts;
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              outputImageBase64 = part.inlineData.data;
              break;
            } else if (part.inline_data && part.inline_data.data) {
              outputImageBase64 = part.inline_data.data;
              break;
            }
          }
        }
      }
    }

    // 如果仍然没有图片数据
    if (!outputImageBase64) {
      // 检查错误类型
      if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
        throw new Error('请求超时，请稍后重试');
      } else if (apiError.code === 'ECONNRESET' || apiError.message.includes('socket hang up')) {
        throw new Error('连接中断，请稍后重试');
      } else {
        const errorMessage = apiError.response ?
          `API错误: ${apiError.response.status} - ${JSON.stringify(apiError.response.data).substring(0, 300)}` :
          `API调用失败: ${apiError.message}`;
        throw new Error(errorMessage);
      }
    }
  }

  // 检测图片类型，根据文件头来判断
  let imageExtension = 'png'; // 默认为png
  const outputBuffer = Buffer.from(outputImageBase64, 'base64');
  const bufferHeader = outputBuffer.slice(0, 4).toString('hex').toLowerCase();

  if (bufferHeader.startsWith('ffd8ff')) {
    imageExtension = 'jpg'; // JPEG
  } else if (bufferHeader.startsWith('89504e47')) {
    imageExtension = 'png'; // PNG
  } else if (bufferHeader.startsWith('47494638')) {
    imageExtension = 'gif'; // GIF
  } else if (bufferHeader.startsWith('49492a00') || bufferHeader.startsWith('4d4d002a')) {
    imageExtension = 'tiff'; // TIFF
  } else if (bufferHeader.startsWith('424d')) {
    imageExtension = 'bmp'; // BMP
  }

  // 上传生成的图片到指定存储
  let generatedPublicPath;
  const generatedFileName = `generated_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${imageExtension}`;


  // 异步保存图片到本地（不阻塞主流程）
  // 使用setTimeout以在主流程完成后异步执行
  setTimeout(async () => {
    try {
      await saveImageLocally(outputBuffer, imageExtension);
      console.log('图片已异步保存到本地');
    } catch (localSaveError) {
      console.error('异步保存图片到本地时发生错误:', localSaveError);
    }
  }, 0);

  try {
    generatedPublicPath = await uploadImage(outputBuffer, generatedFileName, 'generated', `image/${imageExtension}`);
  } catch (uploadError) {
    console.error('图片上传失败:', uploadError);
    // 如果上传失败，返回错误信息而不是让整个处理流程失败
    throw new Error(`图片生成成功但上传失败: ${uploadError.message}`);
  }

  return {
    generatedPublicPath,
    originalPublicPath,
    isSuccessful: true
  };
}

/**
 * 图片到图片模式生成函数
 * @param {Object} params - 生成参数
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImageI2IV2(params) {
  // 设置为i2i模式的默认纵横比和分辨率
  return await generateImageV2({
    ...params,
    aspectRatio: params.aspectRatio || "1:1",
    resolution: params.resolution || "2K"
  });
}

/**
 * 文本到图片模式生成函数
 * @param {Object} params - 生成参数（不包含imageFiles）
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImageT2IV2(params) {
  // 设置为t2i模式的默认纵横比和分辨率
  return await generateImageV2({
    ...params,
    imageFiles: null, // 强制为t2i模式
    aspectRatio: params.aspectRatio || "1:1", 
    resolution: params.resolution || "2K"
  });
}