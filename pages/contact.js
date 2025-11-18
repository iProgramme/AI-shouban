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
          <Link href="/contact" className={styles.navLinkActive}>联系我们</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.header}>
          <h1 className={styles.title}>联系我们</h1>
          <p className={styles.subtitle}>有任何问题？我们随时为您提供帮助</p>
        </section>

        <section className={styles.contactSection}>
          <div className={styles.contactMethods}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>💬</div>
              <h3>微信咨询</h3>
              <p className={styles.contactValue}>teachAIGC</p>
              <p className={styles.contactDesc}>工作日 9:00-18:00</p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📧</div>
              <h3>邮箱支持</h3>
              <p className={styles.contactValue}>
                <a href="mailto:xiongkousuidashi@vip.qq.com" className={styles.emailLink}>
                  xiongkousuidashi@vip.qq.com
                </a>
              </p>
              <p className={styles.contactDesc}>24小时回复</p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>❓</div>
              <h3>常见问题</h3>
              <p className={styles.contactDesc}>查看我们的FAQ页面</p>
              <Link href="/faq" className={styles.faqLink}>访问FAQ</Link>
            </div>
          </div>

          <div className={styles.contactForm}>
            <h3>发送消息</h3>
            <form className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">姓名</label>
                <input type="text" id="name" placeholder="请输入您的姓名" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">邮箱</label>
                <input type="email" id="email" placeholder="请输入您的邮箱" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="subject">主题</label>
                <select id="subject">
                  <option value="">请选择主题</option>
                  <option value="technical">技术服务</option>
                  <option value="billing">账单问题</option>
                  <option value="general">一般咨询</option>
                  <option value="complaint">投诉建议</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">消息</label>
                <textarea
                  id="message"
                  rows="5"
                  placeholder="请详细描述您的问题或建议"
                ></textarea>
              </div>
              <button type="submit" className={styles.submitButton}>发送消息</button>
            </form>
          </div>
        </section>

        <section className={styles.faqSection}>
          <h2>常见问题</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4>如何购买兑换码？</h4>
              <p>您可以在首页点击购买兑换码，选择合适的套餐进行购买。</p>
            </div>
            <div className={styles.faqItem}>
              <h4>生成时间需要多久？</h4>
              <p>通常在提交图片后，AI会在数秒内完成手办生成。</p>
            </div>
            <div className={styles.faqItem}>
              <h4>支持哪些图片格式？</h4>
              <p>目前支持JPG、PNG格式的图片，大小不超过5MB。</p>
            </div>
            <div className={styles.faqItem}>
              <h4>批量购买有什么优惠？</h4>
              <p>20张以上可联系我们获取批量优惠价格。</p>
            </div>
          </div>
        </section>
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

