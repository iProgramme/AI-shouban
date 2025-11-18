import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [galleryItems, setGalleryItems] = useState([]);

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
          <Link href="/generate" className={styles.navLink}>生成图片</Link>
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
            <Link href="/generate" className={styles.ctaPrimary}>
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
      {galleryItems.length > 0 && (
        <section className={styles.galleryPreview}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>作品展示</h2>
            <p className={styles.sectionDescription}>看看其他用户生成的作品</p>
          </div>
          <div className={styles.galleryGrid}>
            {galleryItems.map((item, index) => (
              <div key={item.id || index} className={styles.galleryItem}>
                <div className={styles.galleryImageWrapper}>
                  <img 
                    src={item.original_image_url} 
                    alt="Original" 
                    className={styles.galleryImage}
                  />
                  <div className={styles.galleryOverlay}>
                    <img 
                      src={item.generated_image_url} 
                      alt="Generated" 
                      className={styles.galleryImage}
                    />
                  </div>
                </div>
                <p className={styles.galleryLabel}>原图 → 手办效果</p>
              </div>
            ))}
          </div>
          <div className={styles.galleryCTA}>
            <Link href="/gallery" className={styles.ctaSecondary}>
              查看更多作品
            </Link>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>准备好开始了吗？</h2>
          <p>立即上传您的照片，体验AI手办生成的魅力</p>
          <Link href="/generate" className={styles.ctaPrimaryLarge}>
            开始生成手办
          </Link>
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
