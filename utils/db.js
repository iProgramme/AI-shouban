// utils/db.js
import { Pool } from 'pg';

// Create a connection pool for Neon database
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the database connection
export async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// Initialize the database tables if they don't exist
export async function initDb() {
  try {
    // 先删除所有现有表（如果存在）
    await pool.query(`DROP TABLE IF EXISTS generated_images CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS redemption_codes CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS orders CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE`);

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table for payment tracking
    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create redemption_codes table
    await pool.query(`
      CREATE TABLE redemption_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) UNIQUE NOT NULL,
        order_id VARCHAR(255) REFERENCES orders(order_id),
        user_id INTEGER REFERENCES users(id),
        used BOOLEAN DEFAULT FALSE,
        usage_count INTEGER DEFAULT 1, -- 可使用的次数
        used_count INTEGER DEFAULT 0,  -- 已使用的次数
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);

    // Create generated_images table
    await pool.query(`
      CREATE TABLE generated_images (
        id SERIAL PRIMARY KEY,
        original_image_url TEXT,
        generated_image_url TEXT,
        user_id INTEGER REFERENCES users(id),
        redemption_code_id INTEGER REFERENCES redemption_codes(id),
        status VARCHAR(50) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

// Create a new user
export async function createUser(email) {
  const result = await pool.query(
    'INSERT INTO users (email) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
    [email]
  );
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  // If user exists, get the existing user id
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  return existingUser.rows[0]?.id || null;
}

// Create an order
export async function createOrder(orderId, userId, amount) {
  const result = await pool.query(
    'INSERT INTO orders (order_id, user_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING id',
    [orderId, userId, amount, 'pending']
  );
  return result.rows[0].id;
}

// Update order status
export async function updateOrderStatus(orderId, status) {
  await pool.query(
    'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2',
    [status, orderId]
  );
}

// Get order by order_id
export async function getOrderByOrderId(orderId) {
  const result = await pool.query(
    'SELECT * FROM orders WHERE order_id = $1',
    [orderId]
  );
  return result.rows[0] || null;
}

// Create redemption codes (batch)
export async function createRedemptionCodes(orderId, userId, count, usageCount = 1) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate a random code - 更符合实际使用的兑换码格式
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 确保兑换码在数据库中是唯一的
    code = 'AI' + code;

    const result = await pool.query(
      'INSERT INTO redemption_codes (code, order_id, user_id, usage_count) VALUES ($1, $2, $3, $4) RETURNING code',
      [code, orderId, userId, usageCount]
    );

    codes.push(result.rows[0].code);
  }

  return codes;
}

// Verify a redemption code
export async function verifyRedemptionCode(code) {
  try {
    const result = await pool.query(
      'SELECT id, user_id, used, order_id, usage_count, used_count FROM redemption_codes WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: '无效的兑换码' };
    }

    const redemptionCode = result.rows[0];

    // 检查是否已达到使用次数上限
    if (redemptionCode.used_count >= redemptionCode.usage_count) {
      return { valid: false, error: '兑换码使用次数已达上限' };
    }

    return {
      valid: true,
      userId: redemptionCode.user_id,
      id: redemptionCode.id,
      orderId: redemptionCode.order_id,
      usageCount: redemptionCode.usage_count,
      usedCount: redemptionCode.used_count
    };
  } catch (error) {
    console.error('验证兑换码错误:', error);
    return { valid: false, error: '数据库错误' };
  }
}

// Mark a redemption code as used (increment used count)
export async function useRedemptionCode(codeId) {
  try {
    await pool.query(
      'UPDATE redemption_codes SET used_count = used_count + 1 WHERE id = $1',
      [codeId]
    );
  } catch (error) {
    console.error('更新兑换码使用次数错误:', error);
    throw error;
  }
}

// Save generated image
export async function saveGeneratedImage(originalImageUrl, generatedImageUrl, userId, redemptionCodeId) {
  try {
    const result = await pool.query(
      'INSERT INTO generated_images (original_image_url, generated_image_url, user_id, redemption_code_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [originalImageUrl, generatedImageUrl, userId, redemptionCodeId]
    );

    return result.rows[0].id;
  } catch (error) {
    console.error('保存生成图片错误:', error);
    throw error;
  }
}

// Save generation result (success or failure)
export async function saveGenerationResult(originalImageUrl, resultData, userId, redemptionCodeId, status = 'success', errorMessage = null) {
  try {
    const result = await pool.query(
      'INSERT INTO generated_images (original_image_url, generated_image_url, user_id, redemption_code_id, status, error_message) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [originalImageUrl, resultData, userId, redemptionCodeId, status, errorMessage]
    );

    return result.rows[0].id;
  } catch (error) {
    console.error('保存生成结果错误:', error);
    throw error;
  }
}

// Get gallery images
export async function getGalleryImages(limit = 20) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        original_image_url,
        generated_image_url,
        created_at
      FROM generated_images
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  } catch (error) {
    console.error('获取画廊图片错误:', error);
    throw error;
  }
}



