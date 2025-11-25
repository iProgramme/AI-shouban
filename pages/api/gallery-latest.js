// pages/api/gallery-latest.js
import { getGalleryImages } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    // 获取最近的16张图片
    const images = await getGalleryImages(16);
    
    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('获取最新画廊图片错误:', error);
    res.status(500).json({
      success: false,
      message: '获取图片失败'
    });
  }
}