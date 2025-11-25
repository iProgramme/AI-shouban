// scripts/init-db.js
import { initDb } from '../utils/db.js';

async function runInit() {
  try {
    console.log('开始初始化数据库...');
    await initDb();
    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

runInit();