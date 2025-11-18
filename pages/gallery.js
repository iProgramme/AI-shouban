import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Gallery.module.css';

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        const response = await fetch('/api/gallery');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '获取作品失败');
        }

        setGalleryItems(data.images || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>作品展示 - AI手办生成</title>
        <meta name="description" content="查看其他用户生成的手办作品" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎨</span>
          <span>AI手办生成</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>首页</Link>
          <Link href="/generate" className={styles.navLink}>生成图片</Link>
          <Link href="/gallery" className={styles.navLinkActive}>作品展示</Link>
          <Link href="/contact" className={styles.navLink}>联系我们</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>作品展示</h1>
        <p className={styles.description}>查看原图与手办生成效果对比</p>

        {loading && <p className={styles.loading}>加载中...</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.galleryGrid}>
          {!loading && !error && galleryItems.length > 0 ? (
            galleryItems.map((item, index) => (
              <div key={item.id || index} className={styles.galleryItem}>
                <div className={styles.imageComparison}>
                  <div className={styles.originalContainer}>
                    <h4>原图</h4>
                    <img 
                      src={item.original_image_url} 
                      alt="Original" 
                      className={styles.originalImage} 
                    />
                  </div>
                  <div className={styles.generatedContainer}>
                    <h4>手办效果</h4>
                    <img 
                      src={item.generated_image_url} 
                      alt="Generated" 
                      className={styles.generatedImage} 
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            !loading && !error && <p className={styles.empty}>暂无作品展示</p>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <span className={styles.logoIcon}>🎨</span>
              <span>AI手办生成</span>
            </div>
            <p className={styles.footerDescription}>
              专业的AI手办图像生成服务
            </p>
          </div>
          <div className={styles.footerSection}>
            <h4>快速链接</h4>
            <Link href="/">首页</Link>
            <Link href="/generate">生成图片</Link>
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

