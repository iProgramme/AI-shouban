import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/AdminCodes.module.css';

export default function AdminCodes() {
  const [codes, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [images, setImages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [count, setCount] = useState(1);
  const [filterCode, setFilterCode] = useState('');
  const [filterQuantity, setFilterQuantity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageImages, setCurrentPageImages] = useState(1);
  const [currentPageOrders, setCurrentPageOrders] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'generate', 'images', 'orders'
  const itemsPerPage = 16;

  // 检查登录状态
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      window.location.href = '/admin/login';
    }
  }, []);

  // 获取兑换码列表
  useEffect(() => {
    if (activeTab === 'list') {
      fetchCodes();
    } else if (activeTab === 'images') {
      fetchImages();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

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

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/gallery?limit=100'); // 获取更多图片用于分页
      const data = await response.json();
      console.log("data.images:", data.images)
      if (response.ok) {
        setImages(data.images);
      } else {
        setError(data.message || '获取图片失败');
      }
    } catch (err) {
      setError('网络错误');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/get-orders');
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
      } else {
        setError(data.message || '获取订单失败');
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

  // 图片列表分页
  const totalPagesImages = Math.ceil(images.length / itemsPerPage);
  const startIndexImages = (currentPageImages - 1) * itemsPerPage;
  const paginatedImages = images.filter(v => v.generated_image_url).slice(startIndexImages, startIndexImages + itemsPerPage).map(v => ({...v,realUrl: `/api/proxy-image?url=${encodeURIComponent(v.generated_image_url)}`})); 

  // 订单列表分页
  const totalPagesOrders = Math.ceil(orders.length / itemsPerPage);
  const startIndexOrders = (currentPageOrders - 1) * itemsPerPage;
  const paginatedOrders = orders.slice(startIndexOrders, startIndexOrders + itemsPerPage);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = '/admin/login';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('兑换码已复制到剪贴板');
      // 清空成功消息
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      setSuccess('复制失败，请手动复制');
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>后台管理</title>
        <meta name="description" content="后台管理系统" />
      </Head>

      <header className={styles.header}>
        <h1>后台管理</h1>
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
          <button
            className={`${styles.tabButton} ${activeTab === 'images' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('images')}
          >
            图片列表
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            订单列表
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
                          <td className={styles.codeCell}>
                            <div className={styles.codeContainer}>
                              <span className={styles.codeText}>{code.code}</span>
                              <button
                                className={styles.copyButton}
                                onClick={() => copyToClipboard(code.code)}
                                title="复制兑换码"
                              >
                                复制
                              </button>
                            </div>
                          </td>
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

        {/* 图片列表 Tab */}
        {activeTab === 'images' && (
          <div className={styles.imagesSection}>
            <div className={styles.tableHeader}>
              <h2>图片列表</h2>
              <span className={styles.totalCount}>共 {images.length} 张图片</span>
            </div>

            <div className={styles.galleryContainer}>
              {paginatedImages.length > 0 ? (
                <div className={styles.galleryGrid}>
                  {paginatedImages.map((image) => (
                    <div key={image.id} className={styles.imageCard}>
                      <div className={styles.imagePreview}>
                        <img
                          src={image.realUrl}
                          alt={`生成图片 ${image.id}`}
                          className={styles.thumbnail}
                          onError={(e) => {
                            // e.target.src = '/images/placeholder.png'; // 使用占位图
                          }}
                        />
                      </div>
                      <div className={styles.imageInfo}>
                        <p><strong>ID:</strong> {image.id}</p>
                        <p><strong>创建时间:</strong> {formatDate(image.created_at)}</p>
                        <div className={styles.imageActions}>
                          <a
                            href={image.original_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewButton}
                          >
                            查看原图
                          </a>
                          <a
                            href={image.generated_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.viewButton} ${styles.viewButtonSecondary}`}
                          >
                            查看大图
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noData}>暂无图片数据</div>
              )}
            </div>

            {/* 图片列表分页 */}
            {totalPagesImages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPageImages(prev => Math.max(prev - 1, 1))}
                  disabled={currentPageImages === 1}
                  className={styles.pageButton}
                >
                  上一页
                </button>

                <span className={styles.pageInfo}>
                  第 {currentPageImages} 页，共 {totalPagesImages} 页
                </span>

                <button
                  onClick={() => setCurrentPageImages(prev => Math.min(prev + 1, totalPagesImages))}
                  disabled={currentPageImages === totalPagesImages}
                  className={styles.pageButton}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}

        {/* 订单列表 Tab */}
        {activeTab === 'orders' && (
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h2>订单列表</h2>
              <span className={styles.totalCount}>共 {orders.length} 条订单</span>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>订单ID</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>用户ID</th>
                    <th>创建时间</th>
                    <th>更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.order_id}</td>
                        <td>{order.amount}</td>
                        <td>
                          {order.status === 'paid' ? (
                            <span className={styles.statusActive}>已支付</span>
                          ) : order.status === 'pending' ? (
                            <span className={styles.statusPending}>待支付</span>
                          ) : (
                            <span className={styles.statusUsed}>{order.status}</span>
                          )}
                        </td>
                        <td>{order.user_id || '-'}</td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>{formatDate(order.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className={styles.noData}>暂无订单数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 订单列表分页 */}
            {totalPagesOrders > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPageOrders(prev => Math.max(prev - 1, 1))}
                  disabled={currentPageOrders === 1}
                  className={styles.pageButton}
                >
                  上一页
                </button>

                <span className={styles.pageInfo}>
                  第 {currentPageOrders} 页，共 {totalPagesOrders} 页
                </span>

                <button
                  onClick={() => setCurrentPageOrders(prev => Math.min(prev + 1, totalPagesOrders))}
                  disabled={currentPageOrders === totalPagesOrders}
                  className={styles.pageButton}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}