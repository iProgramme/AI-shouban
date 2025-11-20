// pages/api/check-order-status.js
import { getOrderByOrderId } from '../../utils/db';
import { Pool } from 'pg';

// 创建连接池用于查询兑换码
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: '缺少订单ID' });
    }

    // 查询订单状态
    const order = await getOrderByOrderId(orderId);

    if (!order) {
      return res.status(404).json({ message: '订单不存在', status: 'not_found' });
    }

    // 如果订单已支付，查询相关的兑换码
    let redemptionCodes = [];
    if (order.status === 'paid') {
      // 查询该订单下未完全使用的兑换码（used_count < usage_count 表示还有使用次数）
      const result = await pool.query(
        'SELECT code, usage_count, used_count FROM redemption_codes WHERE order_id = $1 AND used_count < usage_count ORDER BY created_at DESC LIMIT 5',
        [orderId]
      );
      redemptionCodes = result.rows.map(row => row.code);
    }

    res.status(200).json({
      status: order.status, // 'pending', 'paid', etc.
      orderId: order.order_id,
      amount: order.amount,
      redemptionCodes, // 返回兑换码数组
      message: `订单状态: ${order.status}`
    });
  } catch (error) {
    console.error('查询订单状态错误:', error);
    res.status(500).json({ message: '查询订单状态失败', error: error.message });
  }
}