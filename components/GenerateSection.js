import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import getLocalizedTexts from '../utils/texts';
import styles from '../styles/Home.module.css';

const texts = getLocalizedTexts();

const GenerateSection = () => {
  const appType = process.env.APP_TYPE || 'default';

  // 如果 APP_TYPE 不是 default，则显示原始组件内容
  if (appType !== 'default') {
    return <OriginalGenerateSection />;
  }

  // 如果 APP_TYPE 是 default，显示支持文生图/图生图的组件
  return <MultiModalGenerateSection />;
};

// 原始组件内容 (当 APP_TYPE != default 时)
const OriginalGenerateSection = () => {
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
  const [redemptionOptions] = useState([
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

  // 支付二维码状态
  const [paymentQRCode, setPaymentQRCode] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null); // 当前订单ID
  const [isPolling, setIsPolling] = useState(false); // 是否正在轮询
  const [pollingIntervalId, setPollingIntervalId] = useState(null); // 轮询定时器ID

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
          setPollingIntervalId(null); // 清除轮询ID
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
          setPollingIntervalId(null); // 清除轮询ID
          setIsPolling(false);
        }
      } catch (error) {
        console.error('轮询订单状态失败:', error);
        clearInterval(pollInterval);
        setPollingIntervalId(null); // 清除轮询ID
        setIsPolling(false);
      }
    }, 3000); // 每3秒检查一次

    // 保存轮询定时器ID以便在需要时清除
    setPollingIntervalId(pollInterval);

    // 设置最大轮询时间，防止无限轮询（5分钟）
    setTimeout(() => {
      clearInterval(pollInterval);
      setPollingIntervalId(null); // 清除轮询ID
      setIsPolling(false);
      if (showQRCode) {
        toast.info('二维码已超时，请重新购买');
      }
    }, 300000); // 5分钟
  };

  // 清除轮询定时器
  const clearPolling = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
      setIsPolling(false);
    }
  };

  // 点击支付弹窗背景关闭弹窗时取消轮询
  const handlePaymentModalClose = () => {
    clearPolling();
    setShowQRCode(false);
    setShowPayment(false);
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
              <div className={styles.paymentModal} onClick={handlePaymentModalClose}>
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
                    showQRCode && paymentQRCode ? (
                      // 显示支付二维码
                      <div className={styles.qrCodeContainer}>
                        <div className={styles.qrCodeContent}>
                          <p className={styles.qrCodeInstruction}>请使用微信扫描下方二维码</p>
                          <p className={styles.qrCodeTip}>支付完成后，系统将自动处理您的订单</p>
                          <p className={styles.qrCodeWarning}>⚠️ 请勿关闭此窗口，系统会自动检测支付状态</p>
                          <img
                            src={paymentQRCode}
                            alt="支付二维码"
                            className={styles.qrCodeImage}
                            onError={(e) => {
                              console.error('二维码加载失败:', e);
                              // 如果二维码加载失败，显示错误信息
                              e.target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.innerHTML = '二维码加载失败，请刷新页面重试';
                              errorDiv.style.color = 'red';
                              errorDiv.style.textAlign = 'center';
                              e.target.parentNode.appendChild(errorDiv);
                            }}
                          />
                          <button
                            className={styles.backToPaymentButton}
                            onClick={() => {
                              setShowQRCode(false);
                              setPaymentQRCode(null);
                            }}
                          >
                            返回选择套餐
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.paymentOptionsWrapper}>
                        <div className={`${styles.paymentOptions} ${paymentLoading ? styles.loadingState : ''}`}>
                          {paymentLoading ? (
                            <div className={styles.loadingContainer}>
                              <div className={styles.spinner}></div>
                              <p>正在创建订单，请稍候...</p>
                            </div>
                          ) : (
                            <>
                              {redemptionOptions.filter(option => !option.hidden).map((option) => (
                                <div
                                  key={option.id}
                                  className={styles.paymentOption}
                                  onClick={() => !paymentLoading && handlePayment(option)}
                                >
                                  <div className={styles.paymentOptionPrice}>{option.price}</div>
                                  <p className={styles.paymentOptionDescription}>{option.description}</p>
                                </div>
                              ))}
                              {/* 测试套餐按钮 - 只有在URL参数包含test=true时才显示 */}
                              {showTestOption && (
                                <div
                                  className={styles.paymentOption}
                                  onClick={() => !paymentLoading && handleTestPayment()}
                                  style={{
                                    background: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div className={styles.paymentOptionPrice}>0.01元测试</div>
                                  <p className={styles.paymentOptionDescription}>系统测试套餐</p>
                                </div>
                              )}

                              <div className={styles.contactSection}>
                                <p className={styles.contactQuestion}>{texts.contactQuestion}</p>
                                <a href="/contact" className={styles.contactLink} onClick={handlePaymentModalClose}>{texts.contactLink}</a>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
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
                                        handlePaymentModalClose();
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

            {processingTime && (
              <p className={styles.processingTime}>{texts.processingTime}{processingTime}{texts.seconds}</p>
            )}
            <p className={styles.downloadWarning}>{texts.downloadWarning}</p>

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
  );
};

// 支持文生图/图生图的组件内容 (当 APP_TYPE == default 时)
const MultiModalGenerateSection = () => {
  const [activeTab, setActiveTab] = useState('text2image'); // 'text2image' or 'image2image'
  const [prompt, setPrompt] = useState(''); // 提示词输入
  const [image, setImage] = useState(null); // 当前选中的图片
  const [previews, setPreviews] = useState([]); // 图生图预览图片数组
  const [selectedImages, setSelectedImages] = useState([]); // 选中的多张图片
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]); // 生成的图片数组
  const [originalImages, setOriginalImages] = useState([]); // 原始图片数组
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [isRealTimeCounting, setIsRealTimeCounting] = useState(false);
  const [redemptionOptions] = useState([
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

  // 支付二维码状态
  const [paymentQRCode, setPaymentQRCode] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null); // 当前订单ID
  const [isPolling, setIsPolling] = useState(false); // 是否正在轮询
  const [pollingIntervalId, setPollingIntervalId] = useState(null); // 轮询定时器ID

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
          setPollingIntervalId(null); // 清除轮询ID
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
          setPollingIntervalId(null); // 清除轮询ID
          setIsPolling(false);
        }
      } catch (error) {
        console.error('轮询订单状态失败:', error);
        clearInterval(pollInterval);
        setPollingIntervalId(null); // 清除轮询ID
        setIsPolling(false);
      }
    }, 3000); // 每3秒检查一次

    // 保存轮询定时器ID以便在需要时清除
    setPollingIntervalId(pollInterval);

    // 设置最大轮询时间，防止无限轮询（5分钟）
    setTimeout(() => {
      clearInterval(pollInterval);
      setPollingIntervalId(null); // 清除轮询ID
      setIsPolling(false);
      if (showQRCode) {
        toast.info('二维码已超时，请重新购买');
      }
    }, 300000); // 5分钟
  };

  // 清除轮询定时器
  const clearPolling = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
      setIsPolling(false);
    }
  };

  // 点击支付弹窗背景关闭弹窗时取消轮询
  const handlePaymentModalClose = () => {
    clearPolling();
    setShowQRCode(false);
    setShowPayment(false);
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

  // 图生图相关处理函数
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (selectedImages.length + files.length > 9) {
      setError('最多只能上传9张图片');
      return;
    }

    const validFiles = [];
    const validPreviews = [];

    files.forEach(file => {
      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) {
        setError(`文件大小不能超过5MB，当前文件大小: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...validPreviews]);
      setError('');
    }
  };

  const removeImage = (index) => {
    const newSelectedImages = [...selectedImages];
    newSelectedImages.splice(index, 1);
    setSelectedImages(newSelectedImages);

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);

    // 释放预览URL
    URL.revokeObjectURL(previews[index]);
  };

  const handleTextToImageGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
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
      // 创建 FormData 对象来发送提示词和兑换码
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('code', code);

      // 调用后端 AI API 生成nano-banana-pro图像
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // 设置生成结果
        setGeneratedImages([data.generatedImageUrl]); // 文生图只生成一张

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

  const handleImageToImageGenerate = async () => {
    if (selectedImages.length === 0) {
      setError('请至少上传一张图片');
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
      // 创建 FormData 对象来发送文件、提示词和兑换码
      const formData = new FormData();

      // 添加提示词
      if (prompt.trim()) {
        formData.append('prompt', prompt);
      }

      // 添加多张图片
      selectedImages.forEach((img, index) => {
        formData.append('images', img); // 使用 images 字段名，后端需要相应处理
      });
      formData.append('code', code);

      // 调用后端 AI API 生成nano-banana-pro图像
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // 设置生成结果 - 假设后端返回一个图片URL数组
        const newGeneratedImages = Array.isArray(data.generatedImageUrl) ?
          data.generatedImageUrl : [data.generatedImageUrl];
        setGeneratedImages(newGeneratedImages);

        // 保存原始图片URL
        setOriginalImages(selectedImages.map(img => URL.createObjectURL(img)));

        if (isClient) {
          newGeneratedImages.forEach(url => saveGeneratedHistory(url)); // 保存到历史记录
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
    <section className={styles.generateSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{texts.generateSectionTitle}</h2>
        <p className={styles.sectionDescription}>{texts.generateSectionDescription}</p>
      </div>

      <div className={styles.generateContainer}>
        <div className={styles.leftSection}>
          {/* Tab 切换区域 */}
          <div className={styles.tabContainer}>
            <div
              className={`${styles.tab} ${activeTab === 'text2image' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('text2image')}
            >
              文生图
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'image2image' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('image2image')}
            >
              图生图
            </div>
          </div>

          {/* 文生图界面 */}
          {activeTab === 'text2image' && (
            <div className={styles.textToImageSection}>
              <div className={styles.textSection}>
                <h3>提示词</h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="请输入生成图片的描述..."
                  className={styles.promptInput}
                />
              </div>
            </div>
          )}

          {/* 图生图界面 */}
          {activeTab === 'image2image' && (
            <div className={styles.imageToImageSection}>
              <div className={styles.textSection}>
                <h3>提示词</h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="请输入生成图片的描述..."
                  className={styles.promptInput}
                />
              </div>

              <div className={styles.uploadSection}>
                <h3>{texts.uploadSectionTitle}</h3>
                <div className={styles.multiImageUpload}>
                  <div className={styles.previewsContainer}>
                    {previews.map((preview, index) => (
                      <div key={index} className={styles.previewItem}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className={styles.previewImage}
                        />
                        <button
                          className={styles.removeButton}
                          onClick={(e) => {
                            e.stopPropagation(); // 防止触发预览项点击事件
                            removeImage(index);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {previews.length < 9 && (
                      <div className={`${styles.previewItem} ${styles.uploadPlaceholder}`}>
                        <input
                          type="file"
                          id="multiImageUpload"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className={styles.fileInput}
                        />
                        <label htmlFor="multiImageUpload" className={styles.uploadLabel}>
                          <div className={styles.uploadIcon}>+</div>
                          <div className={styles.uploadText}>选择图片</div>
                        </label>
                      </div>
                    )}
                  </div>
                  {previews.length > 0 && (
                    <p className={styles.imageCount}>已选择 {previews.length} 张图片</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
              <div className={styles.paymentModal} onClick={handlePaymentModalClose}>
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
                    showQRCode && paymentQRCode ? (
                      // 显示支付二维码
                      <div className={styles.qrCodeContainer}>
                        <div className={styles.qrCodeContent}>
                          <p className={styles.qrCodeInstruction}>请使用微信扫描下方二维码</p>
                          <p className={styles.qrCodeTip}>支付完成后，系统将自动处理您的订单</p>
                          <p className={styles.qrCodeWarning}>⚠️ 请勿关闭此窗口，系统会自动检测支付状态</p>
                          <img
                            src={paymentQRCode}
                            alt="支付二维码"
                            className={styles.qrCodeImage}
                            onError={(e) => {
                              console.error('二维码加载失败:', e);
                              // 如果二维码加载失败，显示错误信息
                              e.target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.innerHTML = '二维码加载失败，请刷新页面重试';
                              errorDiv.style.color = 'red';
                              errorDiv.style.textAlign = 'center';
                              e.target.parentNode.appendChild(errorDiv);
                            }}
                          />
                          <button
                            className={styles.backToPaymentButton}
                            onClick={() => {
                              setShowQRCode(false);
                              setPaymentQRCode(null);
                            }}
                          >
                            返回选择套餐
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.paymentOptionsWrapper}>
                        <div className={`${styles.paymentOptions} ${paymentLoading ? styles.loadingState : ''}`}>
                          {paymentLoading ? (
                            <div className={styles.loadingContainer}>
                              <div className={styles.spinner}></div>
                              <p>正在创建订单，请稍候...</p>
                            </div>
                          ) : (
                            <>
                              {redemptionOptions.filter(option => !option.hidden).map((option) => (
                                <div
                                  key={option.id}
                                  className={styles.paymentOption}
                                  onClick={() => !paymentLoading && handlePayment(option)}
                                >
                                  <div className={styles.paymentOptionPrice}>{option.price}</div>
                                  <p className={styles.paymentOptionDescription}>{option.description}</p>
                                </div>
                              ))}
                              {/* 测试套餐按钮 - 只有在URL参数包含test=true时才显示 */}
                              {showTestOption && (
                                <div
                                  className={styles.paymentOption}
                                  onClick={() => !paymentLoading && handleTestPayment()}
                                  style={{
                                    background: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div className={styles.paymentOptionPrice}>0.01元测试</div>
                                  <p className={styles.paymentOptionDescription}>系统测试套餐</p>
                                </div>
                              )}

                              <div className={styles.contactSection}>
                                <p className={styles.contactQuestion}>{texts.contactQuestion}</p>
                                <a href="/contact" className={styles.contactLink} onClick={handlePaymentModalClose}>{texts.contactLink}</a>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
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
                                        handlePaymentModalClose();
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
              onClick={activeTab === 'text2image' ? handleTextToImageGenerate : handleImageToImageGenerate}
              disabled={isProcessing || (activeTab === 'text2image' && !prompt.trim()) || (activeTab === 'image2image' && selectedImages.length === 0) || !code}
              className={`${styles.generateButton} ${isProcessing || (activeTab === 'text2image' && !prompt.trim()) || (activeTab === 'image2image' && selectedImages.length === 0) || !code ? styles.disabled : ''}`}
            >
              {isProcessing ? texts.generateProcessing : texts.generateButton}
            </button>

            {processingTime && (
              <p className={styles.processingTime}>{texts.processingTime}{processingTime}{texts.seconds}</p>
            )}
            <p className={styles.downloadWarning}>{texts.downloadWarning}</p>

            {error && <div className={styles.error}>{error}</div>}
          </div>
        </div>

        <div className={styles.rightSection}>
          {generatedImages.length > 0 && (
            <div className={styles.resultSection}>
              <h3>{texts.resultSectionTitle}</h3>
              <div className={styles.resultImages}>
                {generatedImages.map((img, index) => (
                  <div key={index} className={styles.imageContainer}>
                    <img
                      src={img}
                      alt={`Generated Result ${index + 1}`}
                      className={styles.resultImage}
                    />
                    <p className={styles.downloadHint}>{texts.downloadHint}</p>
                  </div>
                ))}
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
  );
};

export default GenerateSection;