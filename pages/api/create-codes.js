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

    // 根据购买类型确定每个兑换码的使用次数
    let usageCount = 1;

    // 根据购买类型确定每个兑换码的使用次数
    if (type.includes('张')) {
      // 从类型中提取数字，例如 "3张" -> 3
      const match = type.match(/(\d+)张/);
      if (match && match[1]) {
        usageCount = parseInt(match[1], 10);
      }
    }

    // 创建一个兑换码，可使用指定次数
    const codes = await createRedemptionCodes(orderId, actualUserId, 1, usageCount);

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