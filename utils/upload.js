// utils/upload.js
import COS from 'cos-nodejs-sdk-v5';
import axios from 'axios';
import FormData from 'form-data';

// 创建COS客户端
function createCosClient() {
  const {
    COS_SECRET_ID,
    COS_SECRET_KEY,
    COS_BUCKET,
    COS_REGION
  } = process.env;

  if (!COS_SECRET_ID) {
    throw new Error('缺少COS配置: 请设置COS_SECRET_ID');
  }
  if (!COS_SECRET_KEY) {
    throw new Error('缺少COS配置: 请设置COS_SECRET_KEY');
  }
  if (!COS_BUCKET) {
    throw new Error('缺少COS配置: 请设置COS_BUCKET');
  }
  if (!COS_REGION) {
    throw new Error('缺少COS配置: 请设置COS_REGION');
  }

  return new COS({
    SecretId: COS_SECRET_ID,
    SecretKey: COS_SECRET_KEY,
    FileParallelLimit: 3,      // 控制上传并发数
    ChunkParallelLimit: 3,     // 控制单个文件分片并发数
    ChunkSize: 1024 * 1024,    // 分片大小默认1MB
  });
}

// 上传Buffer到COS
async function uploadToCos(buffer, fileName, imageType = 'original', mimeType = 'image/jpeg') {
  try {
    const client = createCosClient();
    const Bucket = process.env.COS_BUCKET;
    const Region = process.env.COS_REGION;

    // 设置文件在COS中的路径，根据图片类型区分目录
    const Key = `images/${imageType}/${fileName}`;

    // 上传文件到COS
    const result = await client.putObject({
      Bucket,
      Region,
      Key,
      Body: buffer,
      ContentType: mimeType,
    });

    // 返回COS中的文件URL
    return `https://${Bucket}.cos.${Region}.myqcloud.com/${Key}`;
  } catch (error) {
    console.error('COS上传失败:', error);
    throw new Error(`COS上传失败: ${error.message}`);
  }
}

// 上传Buffer到Imgur
async function uploadToImgur(buffer, fileName, imageType = 'original', mimeType = 'image/jpeg') {
  try {
    const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;

    if (!IMGUR_CLIENT_ID) {
      throw new Error('缺少Imgur配置: 请设置IMGUR_CLIENT_ID');
    }

    // 根据API文档，source参数可以接受二进制文件、base64数据或图片URL
    // 使用 FormData 构造 multipart/form-data 请求体
    const formData = new FormData();

    // 根据图片类型设置标题和描述，便于区分
    let title = process.env.IMGUR_TITLE || 'AI Image';
    let description = process.env.IMGUR_DESCRIPTION || '';

    if (imageType === 'original') {
      title = `Original_${title}`;
      description = `User uploaded original image - ${description}`;
    } else if (imageType === 'generated') {
      title = `Generated_${title}`;
      description = `AI generated image - ${description}`;
    }

    // 添加图片数据和其他参数
    // 直接使用Buffer作为二进制数据上传
    // 确保使用正确的文件名格式
    const fileOptions = {
      filename: fileName,
      contentType: mimeType
    };

    formData.append('source', buffer, fileOptions);

    // 添加额外参数，但仅当它们有值时
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    // 发送到Imgur API
    const imgurApiUrl = process.env.IMGUR_BASE_URL || 'https://www.imgur.la/api/1/upload';

    // 创建请求配置，确保头部设置正确
    const config = {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'X-API-Key': IMGUR_CLIENT_ID,  // 使用 X-API-Key 而不是 Authorization
        ...formData.getHeaders()       // 自动设置 multipart/form-data 头部
      },
      timeout: 300000, // 300秒超时
      validateStatus: (status) => status < 500  // 接受4xx错误以便获取响应体
    };

    const response = await axios.post(imgurApiUrl, formData, config);
    console.log('Imgur API响应:', JSON.stringify(response.data));

    // 检查API响应状态
    if (response.data && response.data.success === false) {
      // API明确返回失败
      const errorMsg = response.data.data && response.data.data.error ?
        response.data.data.error :
        (response.data.error || '未知错误');
      throw new Error(`Imgur API错误: ${errorMsg} (状态码: ${response.data.status || 'unknown'})`);
    }

    // 根据API实际返回格式处理成功响应
    // 您的测试显示API返回格式为 { image: { url: "..." }, ... }
    if (response.data && response.data.image && response.data.image.url) {
      return response.data.image.url;
    } else if (response.data && response.data.data && response.data.data.link) {
      // 兼容其他可能的返回格式
      return response.data.data.link;
    } else {
      // 如果API响应成功但缺少预期字段，抛出相应错误
      throw new Error('Imgur API返回格式不正确或缺少图片URL');
    }
  } catch (error) {
    console.error('Imgur上传失败:', error);
    if (error.response) {
      console.error('Imgur API错误详情:', error.response.data);
      // 检查是否有具体的错误信息
      const errorMsg = error.response.data?.data?.error ||
                      error.response.data?.error ||
                      error.response.data?.message ||
                      (error.response.data?.success === false ? error.response.data?.error : '未知错误');
      throw new Error(`Imgur API错误: ${errorMsg} (状态码: ${error.response.status})`);
    } else {
      // 检查错误是否与API密钥有关
      if (error.message && (error.message.includes('403') || error.message.includes('unauthorized') || error.message.toLowerCase().includes('key'))) {
        throw new Error(`Imgur API密钥错误或未授权: 请检查您的IMGUR_CLIENT_ID配置`);
      }
      throw new Error(`Imgur上传失败: ${error.message}`);
    }
  }
}

// 统一上传函数，根据环境变量选择上传方式
export async function uploadImage(buffer, fileName, imageType = 'original', mimeType = 'image/jpeg') {
  const uploadPath = process.env.UPLOAD_PATH || 'tengxun_oss'; // 默认使用腾讯云OSS

  switch (uploadPath.toLowerCase()) {
    case 'tengxun_oss':
    case 'tencent_oss':
      return await uploadToCos(buffer, fileName, imageType, mimeType);
    case 'imgur':
      return await uploadToImgur(buffer, fileName, imageType, mimeType);
    default:
      throw new Error(`未知的上传路径配置: ${uploadPath}，支持的选项: tengxun_oss, imgur`);
  }
}

// 从COS删除文件（仅当使用COS时）
export async function deleteImageFromCos(fileName, imageType = 'original') {
  try {
    const client = createCosClient();
    const Bucket = process.env.COS_BUCKET;
    const Region = process.env.COS_REGION;

    // 设置文件在COS中的路径，根据图片类型构建
    const Key = `images/${imageType}/${fileName}`;

    // 从COS删除文件
    await client.deleteObject({
      Bucket,
      Region,
      Key,
    });
  } catch (error) {
    console.error('COS删除失败:', error);
    throw new Error(`COS删除失败: ${error.message}`);
  }
}