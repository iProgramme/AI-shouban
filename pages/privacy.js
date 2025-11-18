import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Legal.module.css';

export default function Privacy() {
  return (
    <div className={styles.container}>
      <Head>
        <title>隐私政策 - AI手办生成</title>
        <meta name="description" content="隐私政策" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎨</span>
          <span>AI手办生成</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>首页</Link>
          <Link href="/contact" className={styles.navLink}>联系我们</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>隐私政策</h1>
        
        <div className={styles.content}>
          <section>
            <h2>1. 信息收集</h2>
            <p>我们收集您上传的图片、兑换码使用记录以及必要的联系信息，用于提供AI手办生成服务。</p>
          </section>

          <section>
            <h2>2. 信息使用</h2>
            <p>我们使用收集的信息来：</p>
            <ul>
              <li>处理您的图片生成请求</li>
              <li>管理兑换码和订单</li>
              <li>改进我们的服务</li>
              <li>与您沟通服务相关事宜</li>
            </ul>
          </section>

          <section>
            <h2>3. 信息保护</h2>
            <p>我们采取合理的安全措施保护您的个人信息，防止未经授权的访问、使用或泄露。</p>
          </section>

          <section>
            <h2>4. 信息共享</h2>
            <p>我们不会向第三方出售、交易或转让您的个人信息，除非获得您的明确同意或法律要求。</p>
          </section>

          <section>
            <h2>5. 联系我们</h2>
            <p>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
            <p>微信：teachAIGC</p>
            <p>邮箱：xiongkousuidashi@vip.qq.com</p>
          </section>
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

