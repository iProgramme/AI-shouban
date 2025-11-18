// pages/api/verify-code.js
import { verifyRedemptionCode } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    const verificationResult = await verifyRedemptionCode(code);

    if (!verificationResult.valid) {
      return res.status(400).json({ 
        valid: false,
        message: verificationResult.error 
      });
    }

    res.status(200).json({ 
      valid: true,
      message: 'Code is valid' 
    });
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({ message: 'Error verifying code', error: error.message });
  }
}


