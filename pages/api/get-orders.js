// pages/api/get-orders.js
import { Pool } from 'pg';

// 创建连接池用于查询订单
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
    // 查询所有订单，按创建时间倒序排列
    const result = await pool.query(`
      SELECT 
        id, 
        order_id, 
        user_id, 
        amount, 
        status, 
        created_at, 
        updated_at
      FROM orders
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      message: '订单获取成功',
      orders: result.rows
    });
  } catch (error) {
    console.error('获取订单错误:', error);
    res.status(500).json({ message: '获取订单失败', error: error.message });
  }
}