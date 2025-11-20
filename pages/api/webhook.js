// pages/api/webhook.js
import { verifyPaymentHash } from '../../utils/payment';
import { getOrderByOrderId, updateOrderStatus, createRedemptionCodes } from '../../utils/db';

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing to handle form data manually
  },
};

// Payment webhook handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('Webhook: 请求方法不被允许 -', req.method);
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    console.log('Webhook: 收到支付回调请求');

    // Parse form data manually since bodyParser is disabled
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      console.log('Webhook: 开始解析请求体数据');
      req.on('end', () => {
        console.log('Webhook: 请求体解析完成');
        resolve();
      });
      req.on('error', (err) => {
        console.error('Webhook: 请求解析错误:', err);
        reject(err);
      });
    });

    // Convert form data string to object
    const formData = {};
    body.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        formData[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });

    console.log('Webhook: 解析的表单数据:', formData);

    // Verify payment hash
    if (!verifyPaymentHash(formData)) {
      console.log('Webhook: 支付验证失败', formData);
      console.log('Webhook: 验证哈希失败，原始数据:', body);
      return res.status(200).send('fail');
    }

    console.log('Webhook: 支付验证成功');

    if (formData.status === 'OD') {
      console.log('Webhook: 支付成功，订单ID:', formData.trade_order_id);

      // Get order from database
      const order = await getOrderByOrderId(formData.trade_order_id);

      if (order) {
        console.log('Webhook: 数据库中的订单信息:', {
          orderId: formData.trade_order_id,
          orderStatus: order.status,
          orderAmount: order.amount
        });

        if (order.status === 'pending') {
          // Update order status
          await updateOrderStatus(formData.trade_order_id, 'paid');
          console.log('Webhook: 订单状态已更新为已支付');

          // Calculate quantity and usage count based on amount
          let quantity = 1;
          let usageCount = 1; // 每个兑换码的使用次数

          // 为0.01元订单提供特殊处理 - 但现在与普通订单一样生成兑换码
          if (parseFloat(order.amount) === 0.01) {
            // 0.01元测试订单，同样生成一个兑换码
            console.log('Webhook: 检测到0.01元测试订单，按照标准逻辑生成兑换码');

            // 为0.01元订单生成1个兑换码
            quantity = 1;
            usageCount = 1; // 每个码可使用1次

            // Create redemption codes
            await createRedemptionCodes(formData.trade_order_id, order.user_id, quantity, usageCount);
            console.log(`Webhook: 为0.01元测试订单 ${formData.trade_order_id} 创建了 ${quantity} 个兑换码`);

            // 记录支付时间和相关信息
            const now = new Date();
            const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
            const formattedTime = beijingTime.toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });

            console.log(`Webhook: 0.01元测试订单支付时间(北京时间): ${formattedTime}`);
          } else {
            // 根据订单金额确定数量和使用次数
            if (order.amount >= 19.99) {
              quantity = 10; // 19.99元获得10个兑换码
              usageCount = 1; // 每个码可使用1次
            } else if (order.amount >= 7.99) {
              quantity = 3; // 7.99元获得3个兑换码
              usageCount = 1; // 每个码可使用1次
            } else if (order.amount >= 2.99) {
              quantity = 1; // 2.99元获得1个兑换码
              usageCount = 1; // 每个码可使用1次
            } else {
              // 对于其他金额，可以根据需要自定义逻辑
              quantity = Math.floor(order.amount / 2.99); // 每2.99元一个兑换码
              quantity = quantity > 0 ? quantity : 1;
              usageCount = 1;
            }

            // Create redemption codes
            await createRedemptionCodes(formData.trade_order_id, order.user_id, quantity, usageCount);
            console.log(`Webhook: 为订单 ${formData.trade_order_id} 创建了 ${quantity} 个兑换码`);
          }
        } else {
          console.log('Webhook: 订单状态不是pending，当前状态为:', order.status);
        }
      } else {
        console.log('Webhook: 数据库中未找到订单:', formData.trade_order_id);
      }
    } else {
      console.log('Webhook: 支付未成功，状态:', formData.status, '订单ID:', formData.trade_order_id);
    }

    // Always return success to payment gateway
    console.log('Webhook: 响应成功');
    res.status(200).send('success');
  } catch (error) {
    console.error('Webhook error:', error);
    console.error('Webhook error stack:', error.stack);
    res.status(200).send('success');
  }
}

