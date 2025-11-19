const texts = {
  // 页面标题和描述
  pageTitle: 'AI手办生成 - 专业的AI手办图像生成服务',
  pageDescription: '使用AI技术将您的照片转换为精美的手办图像，简单快捷，效果惊艳',
  
  // 导航栏
  navHome: '首页',
  navGallery: '作品展示',
  navContact: '联系我们',
  
  // 首页头部区域
  heroTitle1: '将您的照片',
  heroTitle2: '转换为精美手办',
  heroDescription: '使用先进的AI技术，只需上传一张照片，即可生成专业级手办图像。\\n简单、快速、效果惊艳',
  heroCtaPrimary: '立即开始生成',
  heroCtaSecondary: '查看作品展示',
  
  // 特性部分
  featuresTitle: '为什么选择我们',
  featuresDescription: '专业的技术，优质的服务',
  feature1Title: '快速生成',
  feature1Desc: '先进的AI算法，数秒内完成图像生成，无需等待',
  feature2Title: '专业品质',
  feature2Desc: '高质量的手办风格转换，细节丰富，效果惊艳',
  feature3Title: '安全可靠',
  feature3Desc: '您的隐私和数据安全是我们的首要考虑',
  feature4Title: '价格实惠',
  feature4Desc: '合理的价格，让每个人都能享受AI手办生成服务',
  
  // 如何使用
  howItWorksTitle: '如何使用',
  howItWorksDescription: '简单三步，轻松生成',
  step1: '上传图片',
  step1Desc: '选择您想要转换的照片，支持JPG、PNG格式',
  step2: '输入兑换码',
  step2Desc: '使用兑换码解锁生成功能，或购买新的兑换码',
  step3: '获得手办',
  step3Desc: 'AI自动处理，生成精美的手办风格图像',
  
  // 画廊预览
  galleryPreviewTitle: '作品展示',
  galleryPreviewDescription: '看看其他用户生成的作品',
  galleryOriginal: '原图',
  galleryGenerated: '效果图',
  galleryCtaDescription: '更多作品将在后续版本中展示',
  
  // 生成部分
  generateSectionTitle: '开始生成您的手办',
  generateSectionDescription: '上传图片并输入兑换码，即可生成专属手办',
  uploadSectionTitle: '上传图片',
  hintUpload: '支持 JPG、PNG 格式，最大 5MB',
  selectImage: '选择图片',
  clickBelowUpload: '点击下方按钮上传图片',
  dragUpload: '点击下方按钮上传图片 或 拖拽图片到此处',
  codeSectionTitle: '兑换码',
  codePlaceholder: '请输入兑换码',
  buyCode: '购买兑换码',
  generateButton: '生成手办',
  generateProcessing: '生成中...',
  resultSectionTitle: '生成结果',
  downloadHint: '右键点击或长按图片可下载',
  downloadWarning: '⚠️ 重要提示：图片将在24小时后失效，请尽快下载保存',
  
  // 历史记录
  historySectionTitle: '最近生成记录',
  noHistory: '暂无历史记录',
  
  // 支付弹窗
  paymentModalTitle: '购买兑换码',
  paymentTabBuy: '购买套餐',
  paymentTabHistory: '购买历史',
  contactQuestion: '遇到问题？',
  contactLink: '联系我们',
  noPurchaseHistory: '暂无购买历史',
  copyButton: '复制',
  useButton: '使用',
  
  // 错误和提示
  errorNoImage: '请先上传图片',
  errorNoCode: '请输入兑换码',
  errorNoImageSize: '文件大小不能超过5MB，当前文件大小: ',
  errorInvalidImage: '请选择图片文件',
  errorInvalidCode: '兑换码无效，请重新输入',
  errorCodeUsed: '兑换码已被使用',
  errorDatabase: '数据库错误',
  errorGenerating: '生成失败，请稍后重试',
  errorPaymentFailed: '购买失败，请稍后重试',
  errorImageTooLarge: '图片过大，请确保图片小于5MB后重新上传。当前文件大小: ',
  errorImageCompressionFailed: '图片压缩失败，请确保图片小于5MB后重新上传。',
  errorApiNotConfigured: 'API配置未完成',
  errorInvalidMethod: '请求方法不被允许',
  errorMissingRequiredFields: '缺少必需的参数',
  errorDbConnectionFailed: '数据库连接失败',
  errorDbInitFailed: '数据库初始化失败',
  errorGalleryRetrievalFailed: '获取画廊图片失败',
  errorPaymentInitFailed: '支付发起失败',
  errorImageGenerationFailed: '图片生成失败',
  errorCodeCreationFailed: '创建兑换码失败',
  errorCodeRequired: '请提供兑换码',
  errorImageFileRequired: '请提供图片文件',
  errorApiKeyNotConfigured: 'API密钥未配置',
  errorNoImageContent: '未找到生成的图片内容',
  errorInvalidImageResponse: '响应中未包含有效的图片URL或base64数据',
  
  // 成功提示
  successCodeCreated: '购买成功！兑换码已自动填入：',
  successImageGenerated: '生成成功！耗时 ',
  successImageGenerated2: ' 秒',
  successDbInit: '数据库初始化成功',
  successPaymentInit: '支付发起成功',
  successCodeCreation: '兑换码创建成功',
  successGalleryRetrieval: '画廊图片获取成功',
  successImageGeneration: '图片生成成功',
  
  // 常见问题
  faqTitle: '常见问题',
  faqDescription: '快速找到您问题的答案',
  faq1Question: '如何购买兑换码？',
  faq1Answer: '您可以在首页点击购买兑换码，选择合适的套餐进行购买。我们提供多种套餐以满足不同需求。',
  faq2Question: '生成时间需要多久？',
  faq2Answer: '通常在提交图片后，AI会在数秒内完成手办生成。处理时间也取决于当前服务器负载情况。',
  faq3Question: '支持哪些图片格式？',
  faq3Answer: '目前支持JPG、PNG格式的图片，大小不超过5MB。建议使用正面清晰的人像图片以获得最佳效果。',
  faq4Question: '批量购买有什么优惠？',
  faq4Answer: '20张以上可联系我们获取批量优惠价格。我们为商业用户和大量需求用户提供定制化方案。',
  
  // 页脚
  footerDescription: '专业的AI手办图像生成服务，让您的照片焕发新的生命力',
  footerQuickLinks: '快速链接',
  footerLegalInfo: '法律信息',
  footerContact: '联系方式',
  footerCopyRight: '© 2024 AI手办生成. 保留所有权利.',
  
  // 联系页面
  contactPageTitle: '联系我们 - AI手办生成',
  contactPageDescription: '联系我们获取支持',
  contactTitle: '联系我们',
  contactSubtitle: '有任何问题？我们随时为您提供帮助',
  contactWechat: '微信咨询',
  contactEmail: '邮箱支持',
  contactHours: '工作日 9:00-18:00',
  contactHours24: '24小时回复',
  contactEmailLink: 'xiongkousuidashi@vip.qq.com',
  
  // 隐私政策和条款页面
  privacyPageTitle: '隐私政策 - AI手办生成',
  privacyPageDescription: '隐私政策',
  privacyTitle: '隐私政策',
  privacySection1Title: '1. 信息收集',
  privacySection1Content: '我们收集您上传的图片、兑换码使用记录以及必要的联系信息，用于提供AI手办生成服务。',
  privacySection2Title: '2. 信息使用',
  privacySection2Content: '我们使用收集的信息来：',
  privacySection2List: ['处理您的图片生成请求', '管理兑换码和订单', '改进我们的服务', '与您沟通服务相关事宜'],
  privacySection3Title: '3. 信息保护',
  privacySection3Content: '我们采取合理的安全措施保护您的个人信息，防止未经授权的访问、使用或泄露。',
  privacySection4Title: '4. 信息共享',
  privacySection4Content: '我们不会向第三方出售、交易或转让您的个人信息，除非获得您的明确同意或法律要求。',
  privacySection5Title: '5. 联系我们',
  privacySection5Content: '如果您对本隐私政策有任何疑问，请通过以下方式联系我们：',
  
  termsPageTitle: '服务条款 - AI手办生成',
  termsPageDescription: '服务条款',
  termsTitle: '服务条款',
  termsSection1Title: '1. 服务说明',
  termsSection1Content: '本服务提供AI手办图像生成功能，用户上传图片后，系统将生成对应的手办风格图像。',
  termsSection2Title: '2. 用户责任',
  termsSection2Content: '用户在使用本服务时，应确保：',
  termsSection2List: ['上传的图片不侵犯他人版权或肖像权', '不上传违法、不当或有害内容', '妥善保管兑换码，避免泄露'],
  termsSection3Title: '3. 兑换码使用',
  termsSection3Content: '兑换码一经使用即失效，不可重复使用。兑换码不得转让或出售给他人。',
  termsSection4Title: '4. 支付与退款',
  termsSection4Content: '购买兑换码后，如无特殊情况，不予退款。如有问题，请联系客服处理。',
  termsSection5Title: '5. 服务变更',
  termsSection5Content: '我们保留随时修改或终止服务的权利，恕不另行通知。',
  termsSection6Title: '6. 免责声明',
  termsSection6Content: '我们不对生成结果的质量、准确性或适用性作任何保证。用户对使用本服务产生的任何后果自行承担责任。',
  termsSection7Title: '7. 联系我们',
  termsSection7Content: '如有任何问题或争议，请通过以下方式联系我们：',
  
  // 计时和处理时间相关
  processingTime: '处理耗时：',
  seconds: ' 秒',
  
  // 其他
  logoText: 'AI手办生成'
};

export default texts;