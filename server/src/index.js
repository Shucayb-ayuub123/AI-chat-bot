import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  try {
    await connectDB(env.mongoUri);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.error('Set MONGODB_URI in server/.env (local or Atlas connection string).');
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`Gemini model: ${env.geminiModel}`);
    if (!env.geminiApiKey) {
      console.warn('GEMINI_API_KEY is missing. Chat requests will fail until it is set.');
    }
  });
}

start();
