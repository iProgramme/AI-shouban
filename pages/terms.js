import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Legal.module.css';

export default function Terms() {
  return (
    <div className={styles.container}>
      <Head>
        <title>服务条款 - AI手办生成</title>
        <meta name="description" content="服务条款" />
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
        <h1 className={styles.title}>服务条款</h1>
        
        <div className={styles.content}>
          <section>
            <h2>1. 服务说明</h2>
            <p>本服务提供AI手办图像生成功能，用户上传图片后，系统将生成对应的手办风格图像。</p>
          </section>

          <section>
            <h2>2. 用户责任</h2>
            <p>用户在使用本服务时，应确保：</p>
            <ul>
              <li>上传的图片不侵犯他人版权或肖像权</li>
              <li>不上传违法、不当或有害内容</li>
              <li>妥善保管兑换码，避免泄露</li>
            </ul>
          </section>

          <section>
            <h2>3. 兑换码使用</h2>
            <p>兑换码一经使用即失效，不可重复使用。兑换码不得转让或出售给他人。</p>
          </section>

          <section>
            <h2>4. 支付与退款</h2>
            <p>购买兑换码后，如无特殊情况，不予退款。如有问题，请联系客服处理。</p>
          </section>

          <section>
            <h2>5. 服务变更</h2>
            <p>我们保留随时修改或终止服务的权利，恕不另行通知。</p>
          </section>

          <section>
            <h2>6. 免责声明</h2>
            <p>我们不对生成结果的质量、准确性或适用性作任何保证。用户对使用本服务产生的任何后果自行承担责任。</p>
          </section>

          <section>
            <h2>7. 联系我们</h2>
            <p>如有任何问题或争议，请通过以下方式联系我们：</p>
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

