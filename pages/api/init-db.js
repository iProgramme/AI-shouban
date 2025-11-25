// pages/api/init-db.js
import { initDb } from '../../utils/db.js';

export default async function handler(req, res) {
  // 仅在开发环境下允许
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: '此功能仅在开发环境下可用' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  // 可以添加一个简单的密钥验证
  const { confirm } = req.body;
  if (confirm !== 'yes') {
    return res.status(400).json({ message: '请在请求体中包含 { "confirm": "yes" }' });
  }

  try {
    console.log('开始初始化数据库...');
    await initDb();
    console.log('数据库初始化完成！');
    
    res.status(200).json({ message: '数据库初始化成功' });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    res.status(500).json({ message: '数据库初始化失败', error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: true
  }
};