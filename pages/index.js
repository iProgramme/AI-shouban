import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import styles from '../styles/Home.module.css';
import getLocalizedTexts from '../utils/texts';
import GenerateSection from '../components/GenerateSection';

const texts = getLocalizedTexts();

export default function Home() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [isRealTimeCounting, setIsRealTimeCounting] = useState(false);
  const [redemptionOptions, setRedemptionOptions] = useState([
    { id: 1, price: '2.99元', description: '1张', value: 1 },
    { id: 2, price: '7.99元', description: '3张', value: 3 },
    { id: 3, price: '19.99元', description: '10张', value: 10 },
    { id: 4, price: '联系我们', description: '20张以上', value: 20 },
    { id: 99, price: '0.01元', description: '测试套餐', value: 0.01, hidden: true }, // 隐藏的测试套餐
  ]);

  // 从 localStorage 获取购买历史
  const [purchaseHistory, setPurchaseHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('purchaseHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    }
    return [];
  });

  // Gallery Preview 状态
  const [galleryShowLightbox, setGalleryShowLightbox] = useState(false);
  const [galleryLightboxImage, setGalleryLightboxImage] = useState('');

  // 支付二维码状态
  const [paymentQRCode, setPaymentQRCode] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null); // 当前订单ID
  const [isPolling, setIsPolling] = useState(false); // 是否正在轮询

  // 生成历史记录状态
  const [generatedHistory, setGeneratedHistory] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('generatedHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      // 只保留最近3天的6条记录
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const filtered = history.filter(item => new Date(item.timestamp) > threeDaysAgo);
      setGeneratedHistory(filtered.slice(0, 6));
    }
  }, []);

  // 保存购买历史到 localStorage
  const saveHistoryToStorage = (newHistory) => {
    setPurchaseHistory(newHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('purchaseHistory', JSON.stringify(newHistory));
    }
  };

  // 保存生成历史到 localStorage
  const saveGeneratedHistory = (newImage) => {
    if (typeof window !== 'undefined') {
      const newHistoryItem = {
        id: Date.now(),
        imageUrl: newImage,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('zh-CN')
      };

      const updatedHistory = [newHistoryItem, ...generatedHistory].slice(0, 6);
      setGeneratedHistory(updatedHistory);

      localStorage.setItem('generatedHistory', JSON.stringify(updatedHistory));
    }
  };

  // 更新兑换码函数
  const updateCode = (newCode) => {
    setCode(newCode);
  };

  // 生成兑换码
  const generateRedemptionCode = (packageType) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // 处理购买
  const handlePayment = async (option) => {
    setPaymentLoading(true);
    setError('');

    try {
      if (option.id === 4) {
        // 如果选择批量版，直接跳转到联系页面
        window.location.href = '/contact';
        setShowPayment(false);
        return;
      }

      // 不传用户ID，让后端创建访客用户
      const userId = null; // 在实际应用中，这里应该是登录用户的ID

      // 发送请求到后端API创建订单
      const response = await fetch('/api/create-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          type: option.description,
          price: option.price,
          quantity: option.value
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.qrCodeUrl) {
          // 显示支付二维码
          setPaymentQRCode(data.qrCodeUrl);
          setCurrentOrderId(data.orderId); // 保存订单ID
          setShowQRCode(true);
          setPaymentLoading(false);
          toast.success('请扫描二维码完成支付');

          // 开始轮询检查订单状态
          startOrderPolling(data.orderId);
        } else if (data.paymentUrl) {
          // 如果没有二维码，尝试直接跳转到支付页面
          setShowPayment(false);
          toast.success('正在跳转到支付页面...');

          // 重定向到支付页面
          setTimeout(() => {
            window.location.href = data.paymentUrl;
          }, 1500);
        } else {
          throw new Error('未能获取支付信息');
        }
      } else {
        throw new Error(data.message || '购买失败');
      }
    } catch (err) {
      setError(err.message || '购买失败，请稍后重试');
    } finally {
      setPaymentLoading(false);
    }
  };

  // 状态用于控制是否显示测试选项
  const [showTestOption, setShowTestOption] = useState(false);

  // 检查URL参数是否包含test=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isTest = urlParams.get('test') === 'true';
      setShowTestOption(isTest);
    }
  }, []);

  // 处理测试支付
  const handleTestPayment = async () => {
    setPaymentLoading(true);
    setError('');

    try {
      // 发送请求到后端API创建测试订单，使用与标准套餐相同的API端点
      const response = await fetch('/api/create-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: null, // 使用访客用户
          type: '测试套餐',
          price: '0.01元',
          quantity: 1
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.qrCodeUrl) {
          // 显示支付二维码
          setPaymentQRCode(data.qrCodeUrl);
          setCurrentOrderId(data.orderId); // 保存订单ID
          setShowQRCode(true);
          setPaymentLoading(false);
          toast.success('请扫描二维码完成支付');

          // 开始轮询检查订单状态
          startOrderPolling(data.orderId);
        } else if (data.paymentUrl) {
          // 如果没有二维码，尝试直接跳转到支付页面
          setShowPayment(false);
          toast.success('正在跳转到支付页面...');

          // 重定向到支付页面
          setTimeout(() => {
            window.location.href = data.paymentUrl;
          }, 1500);
        } else {
          throw new Error('未能获取支付信息');
        }
      } else {
        throw new Error(data.message || '购买失败');
      }
    } catch (err) {
      setError(err.message || '购买失败，请稍后重试');
    } finally {
      setPaymentLoading(false);
    }
  };

  // 轮询订单状态
  const startOrderPolling = (orderId) => {
    if (isPolling) return; // 防止重复轮询

    setIsPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/check-order-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId })
        });

        const result = await response.json();

        if (result.status === 'paid') {
          // 订单已支付，停止轮询
          clearInterval(pollInterval);
          setIsPolling(false);

          // 获取兑换码并填入输入框
          if (result.redemptionCodes && result.redemptionCodes.length > 0) {
            const redemptionCode = result.redemptionCodes[0]; // 取第一个兑换码
            setCode(redemptionCode); // 填入兑换码输入框
            toast.success(`支付成功！兑换码已自动填入：${redemptionCode}`);
          } else {
            toast.success('支付成功！兑换码已生成');
          }

          // 关闭二维码弹窗
          setTimeout(() => {
            setShowQRCode(false);
            setShowPayment(false);
          }, 1500);
        } else if (result.status === 'not_found') {
          // 订单不存在，停止轮询
          clearInterval(pollInterval);
          setIsPolling(false);
        }
      } catch (error) {
        console.error('轮询订单状态失败:', error);
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 3000); // 每3秒检查一次

    // 设置最大轮询时间，防止无限轮询（5分钟）
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
      if (showQRCode) {
        toast.info('二维码已超时，请重新购买');
      }
    }, 300000); // 5分钟
  };

  // 复制兑换码到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('兑换码已复制到剪贴板！');
    }).catch(err => {
      console.error('复制失败', err);
      toast.error('复制失败，请手动复制');
    });
  };

  useEffect(() => {
    // Fetch some gallery items for preview
    const fetchGalleryItems = async () => {
      try {
        const res = await fetch('/api/gallery?limit=3');
        if (!res.ok) throw new Error('Failed to fetch gallery items');
        const data = await res.json();
        if (data.images) {
          setGalleryItems(data.images);
        }
      } catch (error) {
        console.error('Error fetching gallery items:', error);
      }
    };

    fetchGalleryItems();
  }, []);

  // 拖拽相关函数
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        e.dataTransfer.clearData();
        return;
      }

      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) {
        setError(`文件大小不能超过5MB，当前文件大小: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        e.dataTransfer.clearData();
        return;
      }

      // 处理上传
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
      setGeneratedImage(null);
      setOriginalImage(null);

      e.dataTransfer.clearData();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) {
        setError(`文件大小不能超过5MB，当前文件大小: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
      setGeneratedImage(null);
      setOriginalImage(null);
    }
  };


  const handleGenerate = async () => {
    if (!image) {
      setError(texts.errorNoImage);
      return;
    }

    if (!code) {
      setError(texts.errorNoCode);
      return;
    }

    setIsProcessing(true);
    setProcessingTime(null);
    const startTimeValue = Date.now();
    setStartTime(startTimeValue);
    setIsRealTimeCounting(true);  // 开始实时计时
    setError('');

    // 实时更新处理时间
    const timer = setInterval(() => {
      const currentTime = Date.now();
      const timeSpent = ((currentTime - startTimeValue) / 1000).toFixed(2); // 转换为秒
      setProcessingTime(timeSpent);
    }, 100); // 每100毫秒更新一次

    try {
      // 创建 FormData 对象来发送文件和兑换码
      const formData = new FormData();
      formData.append('image', image);
      formData.append('code', code);

      // 调用后端 AI API 生成nano-banana-pro图像
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // 设置生成结果
        setOriginalImage(data.originalImageUrl);
        setGeneratedImage(data.generatedImageUrl);

        if (isClient) {
          saveGeneratedHistory(data.generatedImageUrl); // 保存到历史记录
        }

        setError('');

        // 计算最终处理时间
        const endTime = Date.now();
        const finalTimeSpent = ((endTime - startTimeValue) / 1000).toFixed(2);
        setProcessingTime(finalTimeSpent);

        toast.success(`${texts.successImageGenerated}${finalTimeSpent}${texts.successImageGenerated2}`);
      } else {
        console.error('Generation error:', data);
        setError(data.message || data.error || texts.errorGenerating);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || texts.errorGenerating);
    } finally {
      setIsProcessing(false);
      setIsRealTimeCounting(false);  // 停止实时计时
      clearInterval(timer); // 清除计时器
      // 不再清空兑换码输入框
    }
  };


  return (
    <div className={styles.container}>
      <Head>
        <title>{texts.pageTitle}</title>
        <meta name="description" content={texts.pageDescription} />
      </Head>

      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎨</span>
          <span>{texts.logoText}</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLinkActive}>{texts.navHome}</Link>
          <Link href="/contact" className={styles.navLink}>{texts.navContact}</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            将您的照片
            <br />
            <span className={styles.heroTitleHighlight}>转换为精美nano-banana-pro</span>
          </h1>
          <p className={styles.heroDescription}>
            使用先进的AI技术，只需上传一张照片，即可生成专业级nano-banana-pro图像。
            <br />
            简单、快速、效果惊艳
          </p>
          <div className={styles.heroButtons}>
            <Link href="/" className={styles.ctaPrimary}>
              立即开始生成
            </Link>
            <Link href="/gallery" className={styles.ctaSecondary}>
              查看作品展示
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img
            src={texts.heroImage}
            alt={texts.pageDescription}
            className={styles.heroPreviewImage}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{texts.featuresTitle}</h2>
          <p className={styles.sectionDescription}>{texts.featuresDescription}</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>{texts.feature1Title}</h3>
            <p>{texts.feature1Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>{texts.feature2Title}</h3>
            <p>{texts.feature2Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>{texts.feature3Title}</h3>
            <p>{texts.feature3Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💰</div>
            <h3>{texts.feature4Title}</h3>
            <p>{texts.feature4Desc}</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{texts.howItWorksTitle}</h2>
          <p className={styles.sectionDescription}>{texts.howItWorksDescription}</p>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3>{texts.step1}</h3>
            <p>{texts.step1Desc}</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3>{texts.step2}</h3>
            <p>{texts.step2Desc}</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3>{texts.step3}</h3>
            <p>{texts.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className={styles.galleryPreview}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{texts.galleryPreviewTitle}</h2>
          <p className={styles.sectionDescription}>{texts.galleryPreviewDescription}</p>
        </div>
        <GalleryPreview
          galleryShowLightbox={galleryShowLightbox}
          galleryLightboxImage={galleryLightboxImage}
          setGalleryShowLightbox={setGalleryShowLightbox}
          setGalleryLightboxImage={setGalleryLightboxImage}
        />
      </section>

      {/* Generate Section - 根据 APP_TYPE 显示对应组件 */}
      <GenerateSection />

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{texts.faqTitle}</h2>
          <p className={styles.sectionDescription}>{texts.faqDescription}</p>
        </div>

        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3 className={styles.question}>{texts.faq1Question}</h3>
            <p className={styles.answer}>{texts.faq1Answer}</p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.question}>{texts.faq2Question}</h3>
            <p className={styles.answer}>{texts.faq2Answer}</p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.question}>{texts.faq3Question}</h3>
            <p className={styles.answer}>{texts.faq3Answer}</p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.question}>{texts.faq4Question}</h3>
            <p className={styles.answer}>{texts.faq4Answer}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <span className={styles.logoIcon}>🎨</span>
              <span>{texts.logoText}</span>
            </div>
            <p className={styles.footerDescription}>
              {texts.footerDescription}
            </p>
          </div>
          <div className={styles.footerSection}>
            <h4>{texts.footerQuickLinks}</h4>
            <Link href="/">{texts.navHome}</Link>
            <Link href="/contact">{texts.navContact}</Link>
          </div>
          <div className={styles.footerSection}>
            <h4>{texts.footerLegalInfo}</h4>
            <Link href="/privacy">{texts.navPrivacy || '隐私政策'}</Link>
            <Link href="/terms">{texts.navTerms || '服务条款'}</Link>
          </div>
          <div className={styles.footerSection}>
            <h4>{texts.footerContact}</h4>
            <p>微信：teachAIGC</p>
            <p>{texts.contactEmailLink}</p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>{texts.footerCopyRight}</p>
        </div>
      </footer>
    </div>
  );
}

// 根据 APP_TYPE 切换的作品展示组件
function GalleryPreview({
  galleryShowLightbox,
  galleryLightboxImage,
  setGalleryShowLightbox,
  setGalleryLightboxImage
}) {
  const appType = process.env.APP_TYPE || 'default';

  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const openLightbox = (imageSrc) => {
    setGalleryLightboxImage(imageSrc);
    setGalleryShowLightbox(true);
  };

  const closeLightbox = () => {
    setGalleryShowLightbox(false);
  };

  // 加载画廊图片的函数
  const loadGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery-latest');
      const data = await response.json();
      if (data.success) {
        setGalleryItems(data.data);
      }
    } catch (error) {
      console.error('加载画廊图片失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载图片
  useEffect(() => {
    loadGalleryImages();
  }, []);

  if (appType === 'default') {
    // APP_TYPE 为 default 时，显示最新的生成图片
    return (
      <div className={styles.galleryGridNew}>
        {loading ? (
          <div className={styles.galleryLoading}>
            <p>正在加载最新作品...</p>
          </div>
        ) : galleryItems.length > 0 ? (
          <>
            {galleryItems.slice(0, 16).map((item, index) => (
              <div key={`${item.id}-${index}`} className={styles.galleryItemSingle}>
                <img
                  src={item.generated_image_url}
                  alt={`Generated artwork ${index + 1}`}
                  className={styles.galleryImageSingle}
                  onClick={() => openLightbox(item.generated_image_url)}
                />
              </div>
            ))}
            {/* 如果图片少于16张，填充空位 */}
            {galleryItems.length < 16 && Array.from({ length: 16 - galleryItems.length }).map((_, index) => (
              <div key={`empty-${index}`} className={styles.galleryItemSingle}>
                <div className={styles.galleryPlaceholder}>
                  暂无图片
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className={styles.galleryEmpty}>
            <p>暂无生成的作品</p>
          </div>
        )}

        {/* Lightbox Modal */}
        {galleryShowLightbox && (
          <div className={styles.lightboxOverlay} onClick={closeLightbox}>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <img src={galleryLightboxImage} alt="Enlarged view" className={styles.lightboxImage} />
              <button className={styles.lightboxClose} onClick={closeLightbox}>×</button>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // APP_TYPE 不为 default 时，显示原有的双图对照组件
    return (
      <>
        <div className={styles.galleryGrid}>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage1Input}
                  alt="Original"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage1Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryOriginal}</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage1Output}
                  alt="Generated"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage1Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryGenerated}</p>
              </div>
            </div>
          </div>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage2Input}
                  alt="Original"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage2Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryOriginal}</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage2Output}
                  alt="Generated"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage2Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryGenerated}</p>
              </div>
            </div>
          </div>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage3Input}
                  alt="Original"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage3Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryOriginal}</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage3Output}
                  alt="Generated"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage3Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryGenerated}</p>
              </div>
            </div>
          </div>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage4Input}
                  alt="Original"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage4Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryOriginal}</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src={texts.galleryImage4Output}
                  alt="Generated"
                  className={styles.galleryImage}
                  onClick={() => openLightbox(texts.galleryImage4Output)}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryGenerated}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.galleryCTA}>
          <p className={styles.galleryDescription}>更多作品将在后续版本中展示</p>
        </div>
      </>
    );
  }
}
