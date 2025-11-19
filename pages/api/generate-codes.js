import { Pool } from 'pg';
import { createRedemptionCodes, createOrder } from '../../utils/db';

// Create a connection pool for Neon database
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
    const { quantity, count } = req.body;

    if (!quantity || !count) {
      return res.status(400).json({ message: '缺少必需的参数' });
    }

    // 验证输入参数
    const usageCount = parseInt(quantity);
    const codeCount = parseInt(count);

    if (isNaN(usageCount) || isNaN(codeCount) || usageCount <= 0 || codeCount <= 0) {
      return res.status(400).json({ message: '参数格式错误，必须为正整数' });
    }

    // 为管理员操作创建一个虚拟订单
    const orderId = 'ADMIN_' + Date.now();
    const userId = 1; // 使用默认管理员用户ID

    // 先创建一个虚拟订单避免外键约束错误
    await createOrder(orderId, userId, 0); // 金额设为0

    // 生成兑换码 (orderId, userId, count, usageCount)
    const codes = await createRedemptionCodes(orderId, userId, codeCount, usageCount);

    res.status(200).json({
      message: '兑换码生成成功',
      codes: codes
    });
  } catch (error) {
    console.error('生成兑换码错误:', error);
    res.status(500).json({ 
      message: '生成兑换码失败', 
      error: error.message 
    });
  }
}