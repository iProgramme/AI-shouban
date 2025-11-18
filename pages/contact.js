import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Contact.module.css';

export default function Contact() {
  return (
    <div className={styles.container}>
      <Head>
        <title>联系我们 - AI手办生成</title>
        <meta name="description" content="联系我们获取支持" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎨</span>
          <span>AI手办生成</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>首页</Link>
          <Link href="/generate" className={styles.navLink}>生成图片</Link>
          <Link href="/gallery" className={styles.navLink}>作品展示</Link>
          <Link href="/contact" className={styles.navLinkActive}>联系我们</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>联系我们</h1>
        
        <div className={styles.contactInfo}>
          <div className={styles.contactMethod}>
            <h2>微信</h2>
            <p className={styles.contactValue}>teachAIGC</p>
          </div>
          
          <div className={styles.contactMethod}>
            <h2>邮箱</h2>
            <p className={styles.contactValue}>
              <a href="mailto:xiongkousuidashi@vip.qq.com" className={styles.emailLink}>
                xiongkousuidashi@vip.qq.com
              </a>
            </p>
          </div>
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

