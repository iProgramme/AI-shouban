// pages/api/webhook.js
import { verifyPaymentHash } from '../../utils/payment';
import { getOrderByOrderId, updateOrderStatus, createRedemptionCodes } from '../../utils/db';

export const config = {
  api: {
    bodyParser: {
      // Support form data from payment gateway
      urlencoded: true,
    },
  },
};

// Payment webhook handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Payment gateway sends form data
    const data = req.body;
    
    // Verify payment hash
    if (!verifyPaymentHash(data)) {
      console.log('Payment verification failed');
      return res.status(200).send('success'); // Still return success to avoid retries
    }

    if (data.status === 'OD') {
      console.log('Payment successful for order:', data.trade_order_id);
      
      // Get order from database
      const order = await getOrderByOrderId(data.trade_order_id);
      
      if (order && order.status === 'pending') {
        // Update order status
        await updateOrderStatus(data.trade_order_id, 'paid');
        
        // Calculate quantity (assuming 10 yuan per code)
        const quantity = Math.floor(order.amount / 10);
        
        // Create redemption codes
        await createRedemptionCodes(data.trade_order_id, order.user_id, quantity);
        
        console.log(`Created ${quantity} redemption codes for order ${data.trade_order_id}`);
      }
    } else {
      console.log('Payment not successful, status:', data.status);
    }

    // Always return success to payment gateway
    res.status(200).send('success');
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return success to avoid retries
    res.status(200).send('success');
  }
}

