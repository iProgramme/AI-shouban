// pages/api/payment.js
import { wxPay } from '../../utils/payment';
import { createOrder, createUser, createRedemptionCodes } from '../../utils/db';
import { uuid } from '../../utils/tools';

// API route to initiate payment
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { amount, quantity } = req.body;

    if (!amount || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate order ID
    const orderId = 'ORDER' + Date.now() + '-' + uuid().replace(/-/g, '').substring(0, 8).toUpperCase();

    // Create or get user (for demo, we use a default user)
    // In production, you should get user from session/auth
    const userId = await createUser('guest@example.com');

    // Create order in database
    await createOrder(orderId, userId, amount);

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

    res.status(200).json({ 
      message: 'Payment initiated successfully', 
      paymentResult,
      orderId
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ message: 'Error initiating payment', error: error.message });
  }
}


