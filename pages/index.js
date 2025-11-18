import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
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
  const [showHistory, setShowHistory] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [redemptionOptions, setRedemptionOptions] = useState([
    { id: 1, price: '2.99元', description: '1张', value: 1 },
    { id: 2, price: '7.99元', description: '3张', value: 3 },
    { id: 3, price: '19.99元', description: '10张', value: 10 },
    { id: 4, price: '联系我们', description: '20张以上', value: 20 },
  ]);

  // 从 localStorage 获取购买历史
  const [purchaseHistory, setPurchaseHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('purchaseHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    }
    return [];
  });

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

      // 生成兑换码
      const newCode = generateRedemptionCode(option.description);

      // 创建购买记录
      const purchaseRecord = {
        id: Date.now(),
        code: newCode,
        type: option.description, // 使用描述替代标题
        timestamp: new Date().toLocaleString('zh-CN'),
        price: option.price
      };

      // 更新购买历史
      const updatedHistory = [purchaseRecord, ...purchaseHistory].slice(0, 10);
      saveHistoryToStorage(updatedHistory);

      // 关闭支付弹窗，填入兑换码
      setShowPayment(false);
      setCode(newCode);

      // 显示成功提示
      toast.success(`购买成功！兑换码已自动填入：${newCode}`);
    } catch (err) {
      setError(err.message || '购买失败，请稍后重试');
    } finally {
      setPaymentLoading(false);
    }
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
      // 验證兌換碼並生成圖像
      // Mock verification and generation for demo purposes
      if (code && code.trim() !== '') {
        // 模拟验证过程
        setOriginalImage('/02.png');
        setGeneratedImage('/02.png'); // 使用相同圖片作為模擬
        if(isClient) {
          saveGeneratedHistory('/02.png'); // 保存到歷史記錄
        }
        setError('');
        // 清空生成後的兌換碼
        setCode('');
      } else {
        setError('兑换码无效，请重新输入');
      }
    } catch (err) {
      setError(err.message || '生成失败，请稍后重试');
    } finally {
      setIsProcessing(false);
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
          <img
            src="/images/hero.png"
            alt="AI手办生成效果预览"
            className={styles.heroPreviewImage}
          />
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
                />
                <p className={styles.galleryImageLabel}>原图</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
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
                />
                <p className={styles.galleryImageLabel}>原图</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
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
                />
                <p className={styles.galleryImageLabel}>原图</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
                />
                <p className={styles.galleryImageLabel}>效果图</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.galleryCTA}>
          <p className={styles.galleryDescription}>更多作品将在后续版本中展示</p>
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
                  <>
                    <img
                      src={preview}
                      alt="Preview"
                      className={styles.previewImage}
                      onClick={() => {
                        // 重置图片选择
                        const fileInput = document.getElementById('homeImageUpload');
                        if (fileInput) fileInput.value = '';
                        setPreview(null);
                        setImage(null);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div className={styles.placeholder}>
                      <p>点击下方按钮上传图片</p>
                      <p className={styles.hint}>支持 JPG、PNG 格式，最大 5MB</p>
                    </div>
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
                  </>
                )}
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
                    <div className={styles.paymentHeader}>
                      <h3>购买兑换码</h3>
                      <div className={styles.paymentTabs}>
                        <button
                          className={`${styles.paymentTab} ${!showHistory ? styles.activeTab : ''}`}
                          onClick={() => setShowHistory(false)}
                        >
                          购买套餐
                        </button>
                        <button
                          className={`${styles.paymentTab} ${showHistory ? styles.activeTab : ''}`}
                          onClick={() => setShowHistory(true)}
                        >
                          购买历史
                        </button>
                      </div>
                    </div>

                    {!showHistory ? (
                      <div className={styles.paymentOptions}>
                        {redemptionOptions.map((option) => (
                          <div
                            key={option.id}
                            className={styles.paymentOption}
                            onClick={() => !paymentLoading && handlePayment(option)}
                          >
                            <div className={styles.paymentOptionPrice}>{option.price}</div>
                            <p className={styles.paymentOptionDescription}>{option.description}</p>
                          </div>
                        ))}
                        <div className={styles.contactSection}>
                          <p className={styles.contactQuestion}>遇到问题？</p>
                          <a href="/contact" className={styles.contactLink} onClick={() => setShowPayment(false)}>联系我们</a>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.purchaseHistory}>
                        <h4>购买历史</h4>
                        {purchaseHistory.length > 0 ? (
                          <div className={styles.historyTable}>
                            <table>
                              <thead>
                                <tr>
                                  <th>兑换码</th>
                                  <th>类型</th>
                                  <th>购买时间</th>
                                  <th>操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {purchaseHistory.map((record) => (
                                  <tr key={record.id}>
                                    <td className={styles.codeCell}>{record.code}</td>
                                    <td>{record.type}</td>
                                    <td>{record.timestamp}</td>
                                    <td>
                                      <button
                                        className={styles.copyButton}
                                        onClick={() => copyToClipboard(record.code)}
                                      >
                                        复制
                                      </button>
                                      <button
                                        className={styles.useButton}
                                        onClick={() => {
                                          setCode(record.code);
                                          setShowPayment(false);
                                        }}
                                      >
                                        使用
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className={styles.noHistory}>暂无购买历史</p>
                        )}
                      </div>
                    )}
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
            {generatedImage && (
              <div className={styles.resultSection}>
                <h3>生成结果</h3>
                <div className={styles.resultImages}>
                  <div className={styles.imageContainer}>
                    <img
                      src={generatedImage}
                      alt="Generated Hand Figurine"
                      className={styles.resultImage}
                    />
                    <p className={styles.downloadHint}>右键点击或长按图片可下载</p>
                  </div>
                </div>
              </div>
            )}

            {/* 历史记录部分 */}
            <div className={styles.historySection}>
              <h3>最近生成记录</h3>
              <div className={styles.historyContainer}>
                {isClient && generatedHistory.length > 0 ? (
                  <div className={styles.historyList}>
                    {generatedHistory.map((item, index) => (
                      <div key={item.id} className={styles.historyItem}>
                        <img
                          src={item.imageUrl}
                          alt="Generated History"
                          className={styles.historyImage}
                        />
                        <p className={styles.historyDate}>{item.date}</p>
                      </div>
                    ))}
                  </div>
                ) : isClient ? (
                  <p className={styles.noHistory}>暂无历史记录</p>
                ) : (
                  <p className={styles.noHistory}>&nbsp;</p> // 占位符以防止布局跳动
                )}
              </div>
            </div>
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
