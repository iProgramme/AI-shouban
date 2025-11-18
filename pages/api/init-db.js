// pages/api/init-db.js
import { initDb, testConnection } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Initialize database tables
    await initDb();

    res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
}


