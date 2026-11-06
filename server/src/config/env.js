import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_chatbot',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  systemPrompt:
    process.env.SYSTEM_PROMPT ||
    'You are a helpful, concise AI assistant. Answer clearly and use markdown when it improves readability.',
};
