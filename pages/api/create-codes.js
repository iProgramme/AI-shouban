// pages/api/create-codes.js
import { createOrder, createUser, createRedemptionCodes } from '../../utils/db';
import { uuid } from '../../utils/tools';
import { wxPay } from '../../utils/payment';

// API route to create redemption codes via payment
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    const { userId, type, price, quantity } = req.body;

    if (!type || !price || !quantity) {
      return res.status(400).json({ message: '缺少必需的参数' });
    }

    // Generate order ID
    const orderId = 'ORDER' + Date.now() + '-' + uuid().replace(/-/g, '').substring(0, 8).toUpperCase();
    
    // Convert price to number and format
    // 处理价格字符串，支持小数点
    let amount = parseFloat(price.replace('元', ''));

    // 特殊处理0.01元测试订单
    if (price === '0.01元') {
      amount = 0.01;
    }

    // Create or get user (for demo, we use a default user if none provided)
    // In production, you should get user from session/auth
    let actualUserId = userId;

    if (!actualUserId) {
      // Create a guest user if none provided
      actualUserId = await createUser('guest@example.com');
    }

    if (!actualUserId) {
      return res.status(400).json({ message: '无法创建用户' });
    }

    // Create order in database
    await createOrder(orderId, actualUserId, amount);

    // Use the current URL as backend URL
    const backendUrl = process.env.NEXT_PUBLIC_APP_URL ||
      `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['host']}`;

    // Initiate payment using the imported wxPay function
    const paymentResult = await wxPay({
      order_id: orderId,
      money: amount,
      title: `购买${quantity}个兑换码`,
      backendUrl: backendUrl,
    });

    // Note: In real implementation, codes are created via webhook after payment success
    // So we don't create codes here directly

    // 检查支付API是否返回了二维码URL
    let qrCodeUrl = null;
    let paymentUrl = null;

    if (paymentResult && typeof paymentResult === 'object') {
      // 如果API返回了二维码URL，优先使用它
      qrCodeUrl = paymentResult.url_qrcode;
      paymentUrl = paymentResult.url;
    } else {
      // 如果返回的是字符串，可能是直接的支付URL
      paymentUrl = paymentResult;
    }

    res.status(200).json({
      message: '订单创建成功',
      orderId,
      qrCodeUrl, // 返回二维码URL
      paymentUrl, // 同时返回支付URL作为备选
      success: true
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ message: '创建订单失败', error: error.message });
  }
}