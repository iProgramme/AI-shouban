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
    return res.status(405).json({ message: '请求方法不被允许' });
  }

  try {
    // Parse form data manually since bodyParser is disabled
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      req.on('end', resolve);
      req.on('error', reject);
    });

    // Convert form data string to object
    const formData = {};
    body.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        formData[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });

    // Verify payment hash
    if (!verifyPaymentHash(formData)) {
      console.log('Payment verification failed', formData);
      return res.status(200).send('fail');
    }

    if (formData.status === 'OD') {
      console.log('Payment successful for order:', formData.trade_order_id);

      // Get order from database
      const order = await getOrderByOrderId(formData.trade_order_id);

      if (order && order.status === 'pending') {
        // Update order status
        await updateOrderStatus(formData.trade_order_id, 'paid');

        // Calculate quantity and usage count based on amount
        let quantity = 1;
        let usageCount = 1; // 每个兑换码的使用次数

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

        console.log(`Created ${quantity} redemption codes for order ${formData.trade_order_id}`);
      }
    } else {
      console.log('Payment not successful, status:', formData.status);
    }

    // Always return success to payment gateway
    res.status(200).send('success');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('success');
  }
}

