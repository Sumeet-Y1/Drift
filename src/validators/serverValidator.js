const { z } = require('zod');

const createServerSchema = z.object({
  name: z.string().min(2).max(50),
});

const createChannelSchema = z.object({
  name: z.string().min(1).max(30),
  type: z.enum(['TEXT', 'VOICE']).default('TEXT'),
});

module.exports = { createServerSchema, createChannelSchema };