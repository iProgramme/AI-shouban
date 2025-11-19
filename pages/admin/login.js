import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/AdminLogin.module.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 从环境变量获取正确的账号密码
    const correctUsername = process.env.ADMIN_USERNAME || '2641927926';
    const correctPassword = process.env.ADMIN_PASSWORD || '5266632311ybw';

    if (username === correctUsername && password === correctPassword) {
      // 登录成功，跳转到兑换码管理页面
      localStorage.setItem('adminLoggedIn', 'true');
      window.location.href = '/admin/codes';
    } else {
      setError('账号或密码错误');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>管理员登录</title>
        <meta name="description" content="管理员登录页面" />
      </Head>

      <main className={styles.main}>
        <div className={styles.loginContainer}>
          <h1 className={styles.title}>管理员登录</h1>
          
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>账号</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="请输入账号"
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>密码</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="请输入密码"
                required
              />
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <button type="submit" className={styles.button}>
              登录
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}