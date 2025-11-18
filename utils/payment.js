// utils/payment.js
import axios from 'axios';
import md5 from 'md5';
import { nowDate, uuid } from './tools';

function getHash(params, appSecret) {
  const sortedParams = Object.keys(params)
    .filter(key => params[key] && key !== 'hash') //过滤掉空值和hash本身
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const stringSignTemp = sortedParams + appSecret;
  const hash = md5(stringSignTemp);
  return hash;
}

export async function wxPay(options) {
  //发起支付的函数
  const params = {
    version: '1.1',
    appid: process.env.PAYMENT_APPID,
    trade_order_id: options.order_id, //商户订单号
    total_fee: options.money, //金额，最多两位小数
    title: options.title,
    time: nowDate(),
    notify_url: `${options.backendUrl}/api/webhook`, //通知回调网址
    nonce_str: uuid(), //随机值
    type: 'WAP',
    wap_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    wap_name: 'AI手办生成',
  };
  
  const hash = getHash(params, process.env.PAYMENT_SECRET);
  
  // 发送 POST 请求
  const requestParams = new URLSearchParams({
    ...params,
    hash,
  });
  
  try {
    const response = await axios.post(
      process.env.PAYMENT_API_URL || 'https://api.xunhupay.com/payment/do.html',
      requestParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
}

export function verifyPaymentHash(data) {
  const appSecret = process.env.PAYMENT_SECRET;
  const receivedHash = data.hash;
  const calculatedHash = getHash(data, appSecret);
  
  return receivedHash === calculatedHash;
}


