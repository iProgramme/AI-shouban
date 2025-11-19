// pages/api/gallery.js
import { getGalleryImages } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    const limit = parseInt(req.query.limit) || 20;
    const images = await getGalleryImages(limit);

    res.status(200).json({
      message: '画廊图片获取成功',
      images
    });
  } catch (error) {
    console.error('画廊错误:', error);
    res.status(500).json({ message: '获取画廊图片失败', error: error.message });
  }
}


