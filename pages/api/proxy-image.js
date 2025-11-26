import axios from 'axios';

export const config = {
  api: {
    responseTimeout: 30000, // 30秒超时
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: '缺少图片URL参数' });
  }

  try {
    // 验证URL格式
    let imageUrl = decodeURIComponent(url); // 解码URL
    const parsedUrl = new URL(imageUrl);
    const validHosts = ['www.imgur.la', 'i.imgur.com', 'imgur.com']; // 允许的域名
    if (!validHosts.some(host => parsedUrl.hostname.includes(host))) {
      return res.status(400).json({ message: '不允许的图片域名' });
    }

    // 从远程服务器获取图片
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer', // 使用 arraybuffer 而不是 stream
      timeout: 15000,
      headers: {
        // 模拟浏览器请求
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity', // 避免压缩
        'Referer': parsedUrl.origin || 'https://www.google.com/', // 设置适当的referer
        'Origin': parsedUrl.origin || 'https://www.google.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    // 检查内容类型，避免非图像内容
    const contentType = imageResponse.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('响应不是图片类型:', contentType);
      return res.status(400).json({ message: 'URL不指向有效的图片资源' });
    }

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 缓存1年
    res.setHeader('Access-Control-Allow-Origin', '*'); // 允许跨域
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 直接发送图片数据
    res.send(imageResponse.data);
  } catch (error) {
    console.error('图片代理错误详情:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: url
    });

    // 发生错误时，返回一个透明的1x1像素gif图片，避免在img标签中显示错误信息
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=60'); // 短暂缓存
    res.status(200).send(transparentGif);
  }
}