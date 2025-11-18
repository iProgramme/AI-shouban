import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [redemptionOptions, setRedemptionOptions] = useState([
    { id: 1, title: '基础版', price: '2.99元', description: '1张兑换码', icon: '✨', value: 1 },
    { id: 2, title: '标准版', price: '7.99元', description: '3张兑换码', icon: '⭐', value: 3 },
    { id: 3, title: '高级版', price: '19.99元', description: '10张兑换码', icon: '🌟', value: 10 },
    { id: 4, title: '批量版', price: '联系我们', description: '20张以上', icon: '📞', value: 20 },
  ]);

  useEffect(() => {
    // Fetch some gallery items for preview
    fetch('/api/gallery?limit=3')
      .then(res => res.json())
      .then(data => {
        if (data.images) {
          setGalleryItems(data.images);
        }
      })
      .catch(() => {});
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过5MB');
        return;
      }

      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
      setGeneratedImage(null);
      setOriginalImage(null);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('请输入兑换码');
      return;
    }

    try {
      // Mock verification for demo purposes
      if (code === 'MOCKCODE') {
        setError('');
        alert('兑换码验证成功！');
      } else {
        setError('兑换码无效');
      }
    } catch (err) {
      setError('验证失败，请稍后重试');
    }
  };

  const handleGenerate = async () => {
    if (!image) {
      setError('请先上传图片');
      return;
    }

    if (!code) {
      setError('请输入兑换码');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Mock image generation - always return the same mock image for demo purposes
      setOriginalImage('/02.png');
      setGeneratedImage('/02.png'); // Using the same image as mock
      setError('');
      setCode('');
    } catch (err) {
      setError(err.message || '生成失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

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

      // Mock payment processing
      alert(`已创建支付订单：购买${option.title}，总计 ${option.price}`);
      setShowPayment(false);
    } catch (err) {
      setError(err.message || '支付失败，请稍后重试');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>AI手办生成 - 专业的AI手办图像生成服务</title>
        <meta name="description" content="使用AI技术将您的照片转换为精美的手办图像，简单快捷，效果惊艳" />
      </Head>

      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎨</span>
          <span>AI手办生成</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLinkActive}>首页</Link>
          <Link href="/gallery" className={styles.navLink}>作品展示</Link>
          <Link href="/contact" className={styles.navLink}>联系我们</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            将您的照片
            <br />
            <span className={styles.heroTitleHighlight}>转换为精美手办</span>
          </h1>
          <p className={styles.heroDescription}>
            使用先进的AI技术，只需上传一张照片，即可生成专业级手办图像。
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
          <div className={styles.heroImagePlaceholder}>
            <div className={styles.heroImageIcon}>🎭</div>
            <p>AI手办生成效果预览</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>为什么选择我们</h2>
          <p className={styles.sectionDescription}>专业的技术，优质的服务</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>快速生成</h3>
            <p>先进的AI算法，数秒内完成图像生成，无需等待</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>专业品质</h3>
            <p>高质量的手办风格转换，细节丰富，效果惊艳</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>安全可靠</h3>
            <p>您的隐私和数据安全是我们的首要考虑</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💰</div>
            <h3>价格实惠</h3>
            <p>合理的价格，让每个人都能享受AI手办生成服务</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>如何使用</h2>
          <p className={styles.sectionDescription}>简单三步，轻松生成</p>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3>上传图片</h3>
            <p>选择您想要转换的照片，支持JPG、PNG格式</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3>输入兑换码</h3>
            <p>使用兑换码解锁生成功能，或购买新的兑换码</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3>获得手办</h3>
            <p>AI自动处理，生成精美的手办风格图像</p>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className={styles.galleryPreview}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>作品展示</h2>
          <p className={styles.sectionDescription}>看看其他用户生成的作品</p>
        </div>
        <div className={styles.galleryGrid}>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/input1.png"
                  alt="Original"
                  className={styles.galleryImage}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    alert('您可以右键点击图片或长按图片来下载');
                  }}
                />
                <p className={styles.galleryImageLabel}>原图</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    alert('您可以右键点击图片或长按图片来下载');
                  }}
                />
                <p className={styles.galleryImageLabel}>效果图</p>
              </div>
            </div>
          </div>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/input1.png"
                  alt="Original"
                  className={styles.galleryImage}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    alert('您可以右键点击图片或长按图片来下载');
                  }}
                />
                <p className={styles.galleryImageLabel}>原图</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    alert('您可以右键点击图片或长按图片来下载');
                  }}
                />
                <p className={styles.galleryImageLabel}>效果图</p>
              </div>
            </div>
          </div>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/input1.png"
                  alt="Original"
                  className={styles.galleryImage}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    alert('您可以右键点击图片或长按图片来下载');
                  }}
                />
                <p className={styles.galleryImageLabel}>原图</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    alert('您可以右键点击图片或长按图片来下载');
                  }}
                />
                <p className={styles.galleryImageLabel}>效果图</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.galleryCTA}>
          <Link href="/gallery" className={styles.ctaSecondary}>
            查看更多作品
          </Link>
        </div>
      </section>

      {/* Generate Section */}
      <section className={styles.generateSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>开始生成您的手办</h2>
          <p className={styles.sectionDescription}>上传图片并输入兑换码，即可生成专属手办</p>
        </div>

        <div className={styles.generateContainer}>
          <div className={styles.leftSection}>
            <div className={styles.uploadSection}>
              <h3>上传图片</h3>
              <div className={styles.uploadArea}>
                {preview ? (
                  <img src={preview} alt="Preview" className={styles.previewImage} />
                ) : (
                  <div className={styles.placeholder}>
                    <p>点击下方按钮上传图片</p>
                    <p className={styles.hint}>支持 JPG、PNG 格式，最大 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  id="homeImageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                />
                <label htmlFor="homeImageUpload" className={styles.uploadButton}>
                  选择图片
                </label>
              </div>
            </div>

            <div className={styles.codeSection}>
              <h3>兑换码</h3>
              <div className={styles.codeInputContainer}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入兑换码"
                  className={styles.codeInput}
                />
                <button onClick={handleVerifyCode} className={styles.verifyButton}>
                  验证
                </button>
              </div>

              <button
                onClick={() => setShowPayment(!showPayment)}
                className={styles.buyButton}
              >
                购买兑换码
              </button>

              {showPayment && (
                <div className={styles.paymentModal} onClick={() => setShowPayment(false)}>
                  <div className={styles.paymentContent} onClick={(e) => e.stopPropagation()}>
                    <h3>购买兑换码</h3>
                    <div className={styles.paymentOptions}>
                      {redemptionOptions.map((option) => (
                        <div key={option.id} className={styles.paymentOption}>
                          <div className={styles.paymentOptionHeader}>
                            <span className={styles.paymentOptionIcon}>{option.icon}</span>
                            <h4>{option.title}</h4>
                          </div>
                          <div className={styles.paymentOptionPrice}>{option.price}</div>
                          <p className={styles.paymentOptionDescription}>{option.description}</p>
                          <button
                            className={styles.paymentOptionButton}
                            onClick={() => handlePayment(option)}
                            disabled={paymentLoading}
                          >
                            {option.id === 4 ? '联系我们' : '立即购买'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isProcessing || !image || !code}
                className={`${styles.generateButton} ${(!image || !code) ? styles.disabled : ''}`}
              >
                {isProcessing ? '生成中...' : '生成手办'}
              </button>

              {error && <div className={styles.error}>{error}</div>}
            </div>
          </div>

          <div className={styles.rightSection}>
            {(generatedImage || originalImage) && (
              <div className={styles.resultSection}>
                <h3>生成结果</h3>
                <div className={styles.resultImages}>
                  {originalImage && (
                    <div className={styles.imageContainer}>
                      <h4>原图</h4>
                      <img
                        src={originalImage}
                        alt="Original"
                        className={styles.resultImage}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          alert('您可以右键点击图片或长按图片来下载');
                        }}
                      />
                    </div>
                  )}
                  {generatedImage && (
                    <div className={styles.imageContainer}>
                      <h4>手办效果</h4>
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className={styles.resultImage}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          alert('您可以右键点击图片或长按图片来下载');
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>常见问题</h2>
          <p className={styles.sectionDescription}>快速找到您问题的答案</p>
        </div>

        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3 className={styles.question}>如何购买兑换码？</h3>
            <p className={styles.answer}>您可以在首页点击购买兑换码，选择合适的套餐进行购买。我们提供多种套餐以满足不同需求。</p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.question}>生成时间需要多久？</h3>
            <p className={styles.answer}>通常在提交图片后，AI会在数秒内完成手办生成。处理时间也取决于当前服务器负载情况。</p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.question}>支持哪些图片格式？</h3>
            <p className={styles.answer}>目前支持JPG、PNG格式的图片，大小不超过5MB。建议使用正面清晰的人像图片以获得最佳效果。</p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.question}>批量购买有什么优惠？</h3>
            <p className={styles.answer}>20张以上可联系我们获取批量优惠价格。我们为商业用户和大量需求用户提供定制化方案。</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <span className={styles.logoIcon}>🎨</span>
              <span>AI手办生成</span>
            </div>
            <p className={styles.footerDescription}>
              专业的AI手办图像生成服务，让您的照片焕发新的生命力
            </p>
          </div>
          <div className={styles.footerSection}>
            <h4>快速链接</h4>
            <Link href="/">首页</Link>
            <Link href="/gallery">作品展示</Link>
            <Link href="/contact">联系我们</Link>
          </div>
          <div className={styles.footerSection}>
            <h4>法律信息</h4>
            <Link href="/privacy">隐私政策</Link>
            <Link href="/terms">服务条款</Link>
          </div>
          <div className={styles.footerSection}>
            <h4>联系方式</h4>
            <p>微信：teachAIGC</p>
            <p>邮箱：xiongkousuidashi@vip.qq.com</p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2024 AI手办生成. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
}
