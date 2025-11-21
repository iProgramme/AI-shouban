import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Generate.module.css';

export default function Generate() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.message || '兑换码无效');
        return;
      }

      setError('');
      alert('兑换码验证成功！');
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
      const formData = new FormData();
      formData.append('image', image);
      formData.append('code', code);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '生成失败');
      }

      setGeneratedImage(data.generatedImageUrl);
      setOriginalImage(data.originalImageUrl);
      setError('');
      setCode('');
    } catch (err) {
      setError(err.message || '生成失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    setError('');

    try {
      const amount = quantity * 10;

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '支付初始化失败');
      }

      if (data.paymentResult) {
        if (data.paymentResult.errcode === 0 && data.paymentResult.url) {
          window.location.href = data.paymentResult.url;
        } else if (data.paymentResult.qrcode) {
          alert('请扫描二维码完成支付。支付成功后，兑换码将自动发放。');
          setShowPayment(false);
        } else {
          alert('支付请求已提交，请等待支付完成。支付成功后，兑换码将自动发放到您的账户。');
          setShowPayment(false);
        }
      } else {
        alert('支付请求已提交，请等待支付完成。支付成功后，兑换码将自动发放到您的账户。');
        setShowPayment(false);
      }
    } catch (err) {
      setError(err.message || '支付失败，请稍后重试');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>生成手办 - AI手办生成</title>
        <meta name="description" content="上传图片并使用兑换码生成手办图像" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>AI手办生成</Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>首页</Link>
          <Link href="/generate" className={styles.navLinkActive}>生成图片</Link>
          <Link href="/contact" className={styles.navLink}>联系我们</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>AI手办生成</h1>
        <p className={styles.subtitle}>上传您的图片，一键生成专属手办</p>

        <div className={styles.generateContainer}>
          <div className={styles.uploadSection}>
            <h2>上传图片</h2>
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
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
              <label htmlFor="imageUpload" className={styles.uploadButton}>
                选择图片
              </label>
            </div>
          </div>

          <div className={styles.codeSection}>
            <h2>兑换码</h2>
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
                  <div className={styles.quantitySelector}>
                    <label>数量：</label>
                    <select value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))}>
                      <option value={1}>1个 (¥10)</option>
                      <option value={5}>5个 (¥50)</option>
                      <option value={10}>10个 (¥100)</option>
                    </select>
                  </div>
                  <div className={styles.totalAmount}>
                    总计: ¥{quantity * 10}
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className={styles.payButton}
                  >
                    {paymentLoading ? '处理中...' : '立即支付'}
                  </button>
                  <button
                    onClick={() => setShowPayment(false)}
                    className={styles.cancelButton}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isProcessing || !image || !code}
              className={`${styles.generateButton} ${(!image || !code) ? styles.disabled : ''}`}
            >
              {isProcessing ? '生成中...' : '生成精美图像'}
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </div>

          {(generatedImage || originalImage) && (
            <div className={styles.resultSection}>
              <h2>生成结果</h2>
              <div className={styles.resultImages}>
                {originalImage && (
                  <div className={styles.imageContainer}>
                    <h3>原图</h3>
                    <img src={originalImage} alt="Original" className={styles.resultImage} />
                  </div>
                )}
                {generatedImage && (
                  <div className={styles.imageContainer}>
                    <h3>手办效果</h3>
                    <img src={generatedImage} alt="Generated hand figurine" className={styles.resultImage} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>AI手办生成</h4>
            <p>专业的AI手办图像生成服务</p>
          </div>
          <div className={styles.footerSection}>
            <h4>快速链接</h4>
            <Link href="/generate">生成图片</Link>
            <Link href="/contact">联系我们</Link>
          </div>
          <div className={styles.footerSection}>
            <h4>法律信息</h4>
            <Link href="/privacy">隐私政策</Link>
            <Link href="/terms">服务条款</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2024 AI手办生成. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
}


