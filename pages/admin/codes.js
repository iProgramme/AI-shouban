import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/AdminCodes.module.css';

export default function AdminCodes() {
  const [codes, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [count, setCount] = useState(1);
  const [filterCode, setFilterCode] = useState('');
  const [filterQuantity, setFilterQuantity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'list'
  const itemsPerPage = 10;

  // 检查登录状态
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      window.location.href = '/admin/login';
    }
  }, []);

  // 获取兑换码列表
  useEffect(() => {
    fetchCodes();
  }, []);

  // 过滤兑换码
  useEffect(() => {
    let result = codes;

    if (filterCode) {
      result = result.filter(code => code.code.toLowerCase().includes(filterCode.toLowerCase()));
    }

    if (filterQuantity) {
      if (filterQuantity === '20+') {
        result = result.filter(code => code.usage_count >= 20);
      } else {
        result = result.filter(code => code.usage_count == filterQuantity);
      }
    }

    setFilteredCodes(result);
    setCurrentPage(1);
  }, [codes, filterCode, filterQuantity]);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/get-codes');
      const data = await response.json();
      if (response.ok) {
        // 按创建时间倒序排列
        const sortedCodes = data.codes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setCodes(sortedCodes);
      } else {
        setError(data.message || '获取兑换码失败');
      }
    } catch (err) {
      setError('网络错误');
    }
  };

  const generateCodes = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // 验证输入
    const usageCount = parseInt(quantity);
    const codeCount = parseInt(count);

    if (isNaN(usageCount) || isNaN(codeCount) || usageCount <= 0 || codeCount <= 0) {
      setError('请输入有效的正整数');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: usageCount,
          count: codeCount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`成功生成 ${codeCount} 个兑换码，每个可使用 ${usageCount} 次`);
        fetchCodes(); // 重新获取兑换码列表
      } else {
        setError(data.message || '生成兑换码失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 计算分页
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = filteredCodes.slice(startIndex, startIndex + itemsPerPage);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = '/admin/login';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>兑换码管理</title>
        <meta name="description" content="兑换码管理页面" />
      </Head>

      <header className={styles.header}>
        <h1>兑换码管理</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>退出登录</button>
      </header>

      <main className={styles.main}>
        {/* Tab 切换 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'list' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('list')}
          >
            兑换码列表
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'generate' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            生成兑换码
          </button>
        </div>

        {/* 兑换码列表 Tab */}
        {activeTab === 'list' && (
          <>
            <div className={styles.filterSection}>
              <h2>筛选条件</h2>
              <div className={styles.filterForm}>
                <div className={styles.formGroup}>
                  <label>兑换码：</label>
                  <input
                    type="text"
                    value={filterCode}
                    onChange={(e) => setFilterCode(e.target.value)}
                    placeholder="输入兑换码"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>按张数筛选：</label>
                  <select
                    value={filterQuantity}
                    onChange={(e) => setFilterQuantity(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">全部</option>
                    <option value="1">1张</option>
                    <option value="3">3张</option>
                    <option value="10">10张</option>
                    <option value="20+">20张及以上</option>
                  </select>
                </div>

                <button
                  onClick={fetchCodes}
                  className={styles.refreshButton}
                >
                  搜索
                </button>
              </div>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h2>兑换码列表</h2>
                <span className={styles.totalCount}>共 {filteredCodes.length} 条记录</span>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>兑换码</th>
                      <th>可使用次数</th>
                      <th>已使用次数</th>
                      <th>状态</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCodes.length > 0 ? (
                      paginatedCodes.map((code) => (
                        <tr key={code.id}>
                          <td>{code.id}</td>
                          <td className={styles.codeCell}>{code.code}</td>
                          <td>{code.usage_count}</td>
                          <td>{code.used_count}</td>
                          <td>
                            {code.used_count >= code.usage_count ? (
                              <span className={styles.statusUsed}>已用完</span>
                            ) : (
                              <span className={styles.statusActive}>可使用</span>
                            )}
                          </td>
                          <td>{formatDate(code.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className={styles.noData}>暂无数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={styles.pageButton}
                  >
                    上一页
                  </button>

                  <span className={styles.pageInfo}>
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={styles.pageButton}
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* 生成兑换码 Tab */}
        {activeTab === 'generate' && (
          <div className={styles.generationSection}>
            <h2>生成新兑换码</h2>
            <div className={styles.generationForm}>
              <div className={styles.formGroup}>
                <label>每个兑换码可使用次数：</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={styles.input}
                  placeholder="例如：1, 3, 10..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>生成兑换码数量：</label>
                <input
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className={styles.input}
                  placeholder="例如：1, 5, 10..."
                />
              </div>

              <button
                onClick={generateCodes}
                disabled={loading}
                className={styles.generateButton}
              >
                {loading ? '生成中...' : '生成兑换码'}
              </button>
            </div>

            {success && <div className={styles.success}>{success}</div>}
            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}
      </main>
    </div>
  );
}