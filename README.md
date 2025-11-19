# AI手办生成网站

一个基于 Next.js + JavaScript + Neon 的 AI 手办图像生成网站。用户可以上传图片，使用兑换码生成手办图像，或通过支付购买兑换码。

## 功能特性

1. **图片生成**：用户上传图片，输入兑换码后生成手办图像
2. **支付购买**：用户可以通过虎皮椒支付购买兑换码
3. **移动端支持**：完全响应式设计，支持移动设备访问

## 技术栈

- **前端框架**：Next.js 14
- **语言**：JavaScript
- **数据库**：Neon (PostgreSQL)
- **支付**：虎皮椒支付 (集成 jsSDK.js)
- **样式**：CSS Modules

## 项目结构

```
AI-shouban/
├── pages/
│   ├── api/              # API 路由
│   │   ├── generate.js   # 图片生成接口
│   │   ├── payment.js    # 支付接口
│   │   ├── webhook.js    # 支付回调接口
│   │   ├── verify-code.js # 兑换码验证接口
│   │   └── init-db.js    # 数据库初始化接口
│   ├── index.js          # 首页（生成图片）
│   ├── contact.js        # 联系我们页
│   ├── privacy.js        # 隐私政策页
│   ├── terms.js          # 服务条款页
│   └── _app.js           # 应用入口
├── styles/               # 样式文件
├── utils/                # 工具函数
│   ├── db.js            # 数据库操作
│   ├── payment.js       # 支付相关
│   └── tools.js         # 通用工具
├── public/              # 静态资源
│   └── uploads/         # 上传的图片（自动创建）
└── package.json
```

## 环境变量配置

创建 `.env.local` 文件（参考 `.env.example`）：

```env
# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Payment Configuration (虎皮椒支付)
PAYMENT_APPID=your_appid_here
PAYMENT_SECRET=your_secret_key_here
PAYMENT_API_URL=https://api.xunhupay.com/payment/do.html

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 安装和运行

1. **安装依赖**

```bash
cd AI-shouban
npm install
```

2. **配置环境变量**

复制 `.env.example` 为 `.env.local` 并填入实际值。

3. **初始化数据库**

访问 `http://localhost:3000/api/init-db` (POST 请求) 或使用以下命令：

```bash
curl -X POST http://localhost:3000/api/init-db
```

4. **启动开发服务器**

```bash
npm run dev
```

5. **访问网站**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 生产环境部署

1. **构建项目**

```bash
npm run build
```

2. **启动生产服务器**

```bash
npm start
```

## 数据库表结构

- **users**: 用户表
- **orders**: 订单表
- **redemption_codes**: 兑换码表
- **generated_images**: 生成的图片表

## API 接口说明

### POST /api/generate
生成手办图像
- 参数：`image` (文件), `code` (兑换码)
- 返回：生成的图片 URL

### POST /api/payment
发起支付
- 参数：`amount` (金额), `quantity` (数量)
- 返回：支付信息

### POST /api/webhook
支付回调接口（由支付平台调用）

### POST /api/verify-code
验证兑换码
- 参数：`code` (兑换码)
- 返回：验证结果

### POST /api/init-db
初始化数据库表结构

## 注意事项

1. **图片存储**：当前实现将图片存储在 `public/uploads` 目录。生产环境建议使用云存储服务（如 AWS S3、阿里云 OSS 等）。

2. **AI 生成**：当前实现为演示版本，实际生成功能需要集成 AI 服务（如 Stable Diffusion API 等）。

3. **支付回调**：确保支付回调 URL 可以公网访问，以便支付平台能够正常回调。

4. **安全性**：
   - 生产环境应启用 HTTPS
   - 添加图片上传验证（文件类型、大小等）
   - 实现用户认证和授权
   - 添加速率限制

## 联系方式

- 微信：teachAIGC
- 邮箱：xiongkousuidashi@vip.qq.com

## 许可证

MIT


