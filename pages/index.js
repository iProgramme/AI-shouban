import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import styles from '../styles/Home.module.css';
import texts from '../utils/texts';

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

      // 生成虚拟用户信息（实际应用中应使用真实用户信息）
      const userId = 'guest'; // 在实际应用中，这里应该是登录用户的ID

      // 发送请求到后端API创建兑换码
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
        const codes = data.codes; // 假设API返回了生成的兑换码数组

        // 创建购买记录
        const purchaseRecord = {
          id: Date.now(),
          code: codes[0], // 使用第一个兑换码
          type: option.description,
          timestamp: new Date().toLocaleString('zh-CN'),
          price: option.price
        };

        // 更新购买历史
        const updatedHistory = [purchaseRecord, ...purchaseHistory].slice(0, 10);
        saveHistoryToStorage(updatedHistory);

        // 关闭支付弹窗，填入兑换码
        setShowPayment(false);
        setCode(codes[0]); // 使用返回的兑换码

        // 显示成功提示
        toast.success(`购买成功！兑换码已自动填入：${codes[0]}`);
      } else {
        throw new Error(data.message || '购买失败');
      }
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

      // 调用后端 AI API 生成手办图像
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
        <div className={styles.galleryGrid}>
          <div className={styles.galleryItem}>
            <div className={styles.galleryPair}>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/input1.png"
                  alt="Original"
                  className={styles.galleryImage}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryOriginal}</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryGenerated}</p>
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
                <p className={styles.galleryImageLabel}>{texts.galleryOriginal}</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryGenerated}</p>
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
                <p className={styles.galleryImageLabel}>{texts.galleryOriginal}</p>
              </div>
              <div className={styles.galleryImageContainer}>
                <img
                  src="/images/output1.png"
                  alt="Generated"
                  className={styles.galleryImage}
                />
                <p className={styles.galleryImageLabel}>{texts.galleryGenerated}</p>
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
          <h2 className={styles.sectionTitle}>{texts.generateSectionTitle}</h2>
          <p className={styles.sectionDescription}>{texts.generateSectionDescription}</p>
        </div>

        <div className={styles.generateContainer}>
          <div className={styles.leftSection}>
            <div className={styles.uploadSection}>
              <h3>{texts.uploadSectionTitle}</h3>
              <div
                className={`${styles.uploadArea} ${isDragActive ? styles.dragActive : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
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
                      <p>{texts.dragUpload}</p>
                      <p className={styles.hint}>{texts.hintUpload}</p>
                    </div>
                    <input
                      type="file"
                      id="homeImageUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={styles.fileInput}
                    />
                    <label htmlFor="homeImageUpload" className={styles.uploadButton}>
                      {texts.selectImage}
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className={styles.codeSection}>
              <h3>{texts.codeSectionTitle}</h3>
              <div className={styles.codeInputContainer}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={texts.codePlaceholder}
                  className={styles.codeInput}
                />
              </div>

              <button
                onClick={() => setShowPayment(!showPayment)}
                className={styles.buyButton}
              >
                {texts.buyCode}
              </button>

              {showPayment && (
                <div className={styles.paymentModal} onClick={() => setShowPayment(false)}>
                  <div className={styles.paymentContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.paymentHeader}>
                      <h3>{texts.paymentModalTitle}</h3>
                      <div className={styles.paymentTabs}>
                        <button
                          className={`${styles.paymentTab} ${!showHistory ? styles.activeTab : ''}`}
                          onClick={() => setShowHistory(false)}
                        >
                          {texts.paymentTabBuy}
                        </button>
                        <button
                          className={`${styles.paymentTab} ${showHistory ? styles.activeTab : ''}`}
                          onClick={() => setShowHistory(true)}
                        >
                          {texts.paymentTabHistory}
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
                          <p className={styles.contactQuestion}>{texts.contactQuestion}</p>
                          <a href="/contact" className={styles.contactLink} onClick={() => setShowPayment(false)}>{texts.contactLink}</a>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.purchaseHistory}>
                        <h4>{texts.paymentTabHistory}</h4>
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
                                        {texts.copyButton}
                                      </button>
                                      <button
                                        className={styles.useButton}
                                        onClick={() => {
                                          setCode(record.code);
                                          setShowPayment(false);
                                        }}
                                      >
                                        {texts.useButton}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className={styles.noHistory}>{texts.noPurchaseHistory}</p>
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
                {isProcessing ? texts.generateProcessing : texts.generateButton}
              </button>

              {error && <div className={styles.error}>{error}</div>}
            </div>
          </div>

          <div className={styles.rightSection}>
            {generatedImage && (
              <div className={styles.resultSection}>
                <h3>{texts.resultSectionTitle}</h3>
                <div className={styles.resultImages}>
                  <div className={styles.imageContainer}>
                    <img
                      src={generatedImage}
                      alt="Generated Hand Figurine"
                      className={styles.resultImage}
                    />
                    <p className={styles.downloadHint}>{texts.downloadHint}</p>
                    <p className={styles.downloadWarning}>{texts.downloadWarning}</p>
                    {processingTime && (
                      <p className={styles.processingTime}>{texts.processingTime}{processingTime}{texts.seconds}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 历史记录部分 */}
            <div className={styles.historySection}>
              <h3>{texts.historySectionTitle}</h3>
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
                  <p className={styles.noHistory}>{texts.noHistory}</p>
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
