// utils/cos.js
import COS from 'cos-nodejs-sdk-v5';

// 创建COS客户端
export function createCosClient() {
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
export async function uploadToCos(buffer, fileName, mimeType = 'image/jpeg') {
  try {
    const client = createCosClient();
    const Bucket = process.env.COS_BUCKET;
    const Region = process.env.COS_REGION;

    // 设置文件在COS中的路径
    const Key = `images/${fileName}`;
    
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

// 从COS删除文件
export async function deleteFromCos(fileName) {
  try {
    const client = createCosClient();
    const Bucket = process.env.COS_BUCKET;
    const Region = process.env.COS_REGION;
    
    // 设置文件在COS中的路径
    const Key = `images/${fileName}`;
    
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