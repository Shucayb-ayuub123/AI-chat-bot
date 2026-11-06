import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { isGeminiConfigured, streamChat } from '../services/gemini.service.js';

const HISTORY_LIMIT = 30;
const MAX_MESSAGE_LENGTH = 8000;

function makeTitle(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New chat';
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
}

function writeEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function listConversations(req, res, next) {
  try {
    const conversations = await Conversation.find().sort({ updatedAt: -1 }).lean();
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
}

export async function createConversation(req, res, next) {
  try {
    const conversation = await Conversation.create({});
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    const messages = await Message.find({ conversationId: conversation._id }).sort({
      createdAt: 1,
      _id: 1,
    });
    res.json({ conversation, messages });
  } catch (error) {
    next(error);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    await Message.deleteMany({ conversationId: conversation._id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function postMessage(req, res, next) {
  let conversation;
  let history;
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: 'The server is missing GEMINI_API_KEY. Add it to server/.env and restart.',
      });
    }

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
      return res.status(400).json({ error: 'Message content is required.' });
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return res.status(413).json({
        error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`,
      });
    }

    conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    await Message.create({
      conversationId: conversation._id,
      role: 'user',
      content,
    });

    const recent = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(HISTORY_LIMIT)
      .lean();
    history = recent.reverse();
  } catch (error) {
    return next(error);
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  let fullText = '';

  try {
    const stream = await streamChat({ history });

    for await (const chunk of stream) {
      const text = chunk?.text ?? '';
      if (!text) continue;
      fullText += text;
      writeEvent(res, { type: 'delta', text });
    }

    if (!fullText.trim()) {
      writeEvent(res, { type: 'error', message: 'The model returned an empty response.' });
      return;
    }

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: fullText,
    });

    if (conversation.title === 'New chat') {
      conversation.title = makeTitle(history.find((item) => item.role === 'user')?.content || '');
    }
    conversation.updatedAt = new Date();
    await conversation.save();

    writeEvent(res, {
      type: 'done',
      message: assistantMessage,
      conversation,
    });
  } catch (error) {
    writeEvent(res, {
      type: 'error',
      message: error.message || 'Failed to generate a response.',
    });
  } finally {
    res.end();
  }
}
