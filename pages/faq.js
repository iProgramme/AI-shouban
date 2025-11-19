import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/FAQ.module.css';

export default function FAQ() {
  const faqs = [
    {
      question: "如何购买兑换码？",
      answer: "您可以在首页点击购买兑换码，选择合适的套餐进行购买。我们提供多种套餐以满足不同需求。"
    },
    {
      question: "生成时间需要多久？",
      answer: "通常在提交图片后，AI会在数秒内完成手办生成。处理时间也取决于当前服务器负载情况。"
    },
    {
      question: "支持哪些图片格式？",
      answer: "目前支持JPG、PNG格式的图片，大小不超过5MB。建议使用正面清晰的人像图片以获得最佳效果。"
    },
    {
      question: "批量购买有什么优惠？",
      answer: "20张以上可联系我们获取批量优惠价格。我们为商业用户和大量需求用户提供定制化方案。"
    },
    {
      question: "生成的图片可以商用吗？",
      answer: "根据我们的服务条款，生成的图片仅供个人使用。如需商用授权，请联系我们的客服团队。"
    },
    {
      question: "如果对生成结果不满意怎么办？",
      answer: "我们提供多次生成服务，您可以使用同一个兑换码重新生成。如果仍有问题，请联系技术支持。"
    },
    {
      question: "如何保证我的图片隐私？",
      answer: "我们严格保护用户隐私，上传的图片仅用于生成处理，不会用于任何其他用途，处理完成后会安全删除。"
    },
    {
      question: "是否可以定制手办风格？",
      answer: "目前我们提供标准的手办风格，未来计划推出更多风格选项。对于特殊需求，可联系我们进行定制服务。"
    }
  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>常见问题 - AI手办生成</title>
        <meta name="description" content="AI手办生成常见问题解答" />
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
        <section className={styles.header}>
          <h1 className={styles.title}>常见问题</h1>
          <p className={styles.subtitle}>快速找到您问题的答案</p>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqItem}>
                <h3 className={styles.question}>{faq.question}</h3>
                <p className={styles.answer}>{faq.answer}</p>
              </div>
            ))}
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