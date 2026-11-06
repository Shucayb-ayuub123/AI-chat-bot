import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'New chat', trim: true, maxlength: 120 },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
