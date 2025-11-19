import { createRedemptionCodes, createUser, createOrder } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    const { userId, type, price, quantity } = req.body;

    if (!userId || !type || !price || !quantity) {
      return res.status(400).json({ message: '缺少必需的参数' });
    }

    // 创建或获取用户
    const user = await createUser(`${userId}@example.com`);
    const actualUserId = user || 1;

    // 生成订单ID
    const orderId = `ORDER${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 创建订单
    await createOrder(orderId, actualUserId, parseFloat(price.replace(/[^\d.-]/g, '')) || 10.00);

    // 生成兑换码
    const codes = await createRedemptionCodes(orderId, actualUserId, quantity);

    res.status(200).json({
      message: '兑换码创建成功',
      codes: codes
    });
  } catch (error) {
    console.error('创建兑换码错误:', error);
    res.status(500).json({
      message: '创建兑换码失败',
      error: error.message
    });
  }
}