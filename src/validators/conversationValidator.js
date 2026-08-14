const { z } = require('zod');

const createConversationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  name: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

module.exports = { createConversationSchema, sendMessageSchema };