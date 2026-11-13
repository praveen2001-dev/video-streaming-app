import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { ensureStorageDirectories } from './src/services/storage.service.js';

const startServer = async () => {
  try {
    // 1. Ensure storage folders exist
    ensureStorageDirectories();

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Start Express server
    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Streaming API running on http://localhost:${env.PORT}`);
      console.log(`[Server] Client Origin allowed: ${env.CLIENT_URL}`);
    });

    const shutdown = () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server Error] Startup failure:', error.message);
    process.exit(1);
  }
};

startServer();
