
import dns from "dns"
dns.setServers(["1.1.1.1", "8.8.8.8"])

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { chatRouter } from './routes/chat.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { isGeminiConfigured } from './services/gemini.service.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, '../../client/dist');

export const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: isGeminiConfigured(),
    model: env.geminiModel,
  });
});

app.use('/api', chatRouter);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);
