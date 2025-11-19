// pages/api/init-db.js
import { initDb, testConnection } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      return res.status(500).json({ message: '数据库连接失败' });
    }

    // Initialize database tables
    await initDb();

    res.status(200).json({ message: '数据库初始化成功' });
  } catch (error) {
    console.error('数据库初始化错误:', error);
    res.status(500).json({ message: '数据库初始化失败', error: error.message });
  }
}


