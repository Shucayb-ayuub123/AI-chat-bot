import { Router } from 'express';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  postMessage,
} from '../controllers/chat.controller.js';

export const chatRouter = Router();

chatRouter.get('/conversations', listConversations);
chatRouter.post('/conversations', createConversation);
chatRouter.get('/conversations/:id', getConversation);
chatRouter.delete('/conversations/:id', deleteConversation);
chatRouter.post('/conversations/:id/messages', postMessage);
