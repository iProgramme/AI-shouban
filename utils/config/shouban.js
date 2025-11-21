const shoubanTexts = {
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
  generateButton: '生成精美图像',
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
  privacySection1Content: '我们收集您上传的图片、兑换码使用记录以及必要的联系信息，用于提供AI手办生成服务。具体包括：',
  privacySection1List: [
    '账户信息：当您注册账户时，我们会收集您的邮箱地址等基本信息',
    '上传内容：您上传的图片将用于AI处理，生成相应的手办风格图像',
    '设备信息：我们可能会收集您的设备型号、操作系统版本、浏览器类型等信息',
    '使用数据：包括您使用服务的时间、频率、兑换码使用情况等',
    '日志信息：包括IP地址、访问时间、浏览器类型等'
  ],
  privacySection2Title: '2. 信息使用',
  privacySection2Content: '我们使用收集的信息来：',
  privacySection2List: [
    '处理您的图片生成请求',
    '管理兑换码和订单',
    '改进我们的服务和用户体验',
    '与您沟通服务相关事宜',
    '进行数据分析以改善服务质量',
    '保障账户和交易安全',
    '提供个性化服务'
  ],
  privacySection3Title: '3. 信息保护',
  privacySection3Content: '我们采取合理的安全措施保护您的个人信息，包括：',
  privacySection3List: [
    '采用行业标准的安全技术和程序保护您的信息免受未经授权的访问、使用或泄露',
    '定期审查我们信息收集、储存和处理的实践，包括物理安全措施',
    '仅授权员工访问您的个人数据，他们受到严格的合同保密义务约束',
    '对敏感数据进行加密处理'
  ],
  privacySection4Title: '4. 信息共享',
  privacySection4Content: '我们承诺不会向第三方出售、交易或转让您的个人信息，但以下情况除外：',
  privacySection4List: [
    '获得您的明确同意',
    '法律法规要求或政府机关要求披露',
    '为保护我们的合法权益，如诉讼或调查需要',
    '与我们信任的合作伙伴分享，他们承诺遵守相同的保密义务',
    '在发生合并、收购或资产转让时'
  ],
  privacySection5Title: '5. Cookie和追踪技术',
  privacySection5Content: '我们使用Cookie和其他追踪技术来改善用户体验、分析网站流量和行为，并提供个性化服务。',
  privacySection6Title: '6. 第三方服务',
  privacySection6Content: '我们的服务可能包含第三方提供的功能或服务，这些服务的隐私政策由第三方自行制定。',
  privacySection7Title: '7. 数据保留',
  privacySection7Content: '我们会根据提供服务所需的期限保留您的个人信息，或根据法律要求保留。',
  privacySection8Title: '8. 儿童隐私',
  privacySection8Content: '我们的服务不面向13岁以下儿童，我们不会有意收集13岁以下儿童的个人信息。',
  privacySection9Title: '9. 隐私政策变更',
  privacySection9Content: '我们可能会不时更新本隐私政策。当发生重大变更时，我们会通过电子邮件或网站公告等方式通知您。',
  privacySection10Title: '10. 联系我们',
  privacySection10Content: '如果您对本隐私政策有任何疑问，请通过以下方式联系我们：',

  termsPageTitle: '服务条款 - AI手办生成',
  termsPageDescription: '服务条款',
  termsTitle: '服务条款',
  termsSection1Title: '1. 服务说明',
  termsSection1Content: '本服务提供AI手办图像生成功能，用户上传图片后，系统将生成对应的个性化手办风格图像。我们努力提供准确、高质量的服务，但生成结果可能存在差异。',
  termsSection2Title: '2. 用户责任',
  termsSection2Content: '用户在使用本服务时，应确保：',
  termsSection2List: [
    '上传的图片不侵犯他人版权、商标、专利或其他知识产权',
    '不上传涉及他人隐私的图片（除非获得明确许可）',
    '不上传违法、色情、暴力、仇恨言论等违反法律法规的内容',
    '不上传任何恶意软件、病毒或其他有害内容',
    '妥善保管兑换码和个人账户信息',
    '遵守当地法律法规和社区准则'
  ],
  termsSection3Title: '3. 兑换码使用',
  termsSection3Content: '兑换码使用规则如下：',
  termsSection3List: [
    '兑换码一经使用即失效，不可重复使用',
    '兑换码不得转让或出售给他人',
    '过期的兑换码将自动失效',
    '兑换码的使用次数有限，用完即止',
    '我们保留取消违规使用兑换码的权利'
  ],
  termsSection4Title: '4. 服务可用性',
  termsSection4Content: '我们致力于提供稳定的服务，但可能出现以下情况：',
  termsSection4List: [
    '系统维护期间可能暂停服务',
    '由于不可抗力因素可能导致服务中断',
    '为了改善服务可能进行临时调整',
    '我们将在合理范围内提前通知服务暂停'
  ],
  termsSection5Title: '5. 支付与退款',
  termsSection5Content: '关于支付和退款：',
  termsSection5List: [
    '购买兑换码后，在无特殊情况（如服务故障、系统错误）下，不予退款',
    '若因我们原因导致服务故障，可申请相应补偿',
    '退款将原路返回到您的支付账户',
    '退款处理时间视支付渠道而定，一般为3-7个工作日'
  ],
  termsSection6Title: '6. 知识产权',
  termsSection6Content: '我们尊重知识产权，同时保护我们的合法权益：',
  termsSection6List: [
    '本服务及相关技术归我们所有',
    '用户对其上传的图片内容承担全部责任',
    'AI生成的图片版权归用户所有',
    '我们保留对服务的修改和改进权利'
  ],
  termsSection7Title: '7. 服务变更',
  termsSection7Content: '我们保留随时修改或终止服务的权利，但会提前通知用户重大变更。我们也会努力减少服务中断，保持服务的连续性。',
  termsSection8Title: '8. 免责声明',
  termsSection8Content: '我们尽力提供高质量的服务，但请注意：',
  termsSection8List: [
    'AI生成结果可能存在与预期不符的情况',
    '图片生成质量和速度可能受网络状况影响',
    '我们不对生成结果的质量、准确性或适用性作绝对保证',
    '用户对使用本服务产生的任何后果自行承担责任',
    '在法律允许的最大范围内，我们不承担任何间接损失或损害'
  ],
  termsSection9Title: '9. 争议解决',
  termsSection9Content: '如发生争议，双方应首先友好协商解决；协商不成的，可向有管辖权的人民法院提起诉讼。',
  termsSection10Title: '10. 法律适用',
  termsSection10Content: '本服务条款的解释和执行适用中华人民共和国法律。',
  termsSection11Title: '11. 其他条款',
  termsSection11Content: '本服务条款构成我们之间的完整协议，取代之前的所有口头或书面沟通。如果本条款的部分内容被认定无效，不影响其他条款的效力。',
  termsSection12Title: '12. 联系我们',
  termsSection12Content: '如有任何问题或争议，请通过以下方式联系我们：',

  // 计时和处理时间相关
  processingTime: '处理耗时：',
  seconds: ' 秒',

  // 作品展示图片
  galleryImage1Input: '/images/input1.png',
  galleryImage1Output: '/images/output1.png',
  galleryImage2Input: '/images/input2.png',
  galleryImage2Output: '/images/output2.png',
  galleryImage3Input: '/images/input3.png',
  galleryImage3Output: '/images/output3.png',
  galleryImage4Input: '/images/input4.png',
  galleryImage4Output: '/images/output4.png',
  heroImage: '/images/hero.png',

  // 生成提示词
  imageGenerationPrompt: '请将这张人物照片转换为精美的手办风格图像。请保持原始人物的特征，但以手办材质和风格呈现。',

  // 其他
  logoText: 'AI手办生成'
};
export default shoubanTexts;