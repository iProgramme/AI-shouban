// pages/api/get-time.js

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: '请求方法不被允许' });
  }
  
  try {
    // 获取当前时间并转换为北京时间
    const now = new Date();
    // 转换为北京时间 (UTC+8)
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // 格式化时间为易读的格式
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
    
    res.status(200).json({
      time: formattedTime,
      timestamp: beijingTime.getTime(),
      timezone: 'Asia/Shanghai',
      message: `当前北京时间: ${formattedTime}`
    });
  } catch (error) {
    console.error('获取时间错误:', error);
    res.status(500).json({ message: '获取时间失败', error: error.message });
  }
}