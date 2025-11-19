import { Pool } from 'pg';

// Create a connection pool for Neon database
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    // 获取所有兑换码信息
    const result = await pool.query(`
      SELECT 
        id, 
        code, 
        usage_count, 
        used_count, 
        created_at 
      FROM redemption_codes 
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      message: '获取兑换码成功',
      codes: result.rows
    });
  } catch (error) {
    console.error('获取兑换码错误:', error);
    res.status(500).json({ 
      message: '获取兑换码失败', 
      error: error.message 
    });
  }
}