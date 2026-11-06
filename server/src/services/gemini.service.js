import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

let client;

function getClient() {
  if (!env.geminiApiKey) {
    const error = new Error('GEMINI_API_KEY is not configured on the server.');
    error.statusCode = 503;
    throw error;
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

export function isGeminiConfigured() {
  return Boolean(env.geminiApiKey);
}

export async function streamChat({ history, systemPrompt, model }) {
  const ai = getClient();
  const contents = history.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  return ai.models.generateContentStream({
    model: model || env.geminiModel,
    contents,
    config: {
      systemInstruction: systemPrompt || env.systemPrompt,
      temperature: 0.8,
    },
  });
}
