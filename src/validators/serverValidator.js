const { z } = require('zod');

const createServerSchema = z.object({
  name: z.string().min(2).max(50),
});

const createChannelSchema = z.object({
  name: z.string().min(1).max(30),
});

module.exports = { createServerSchema, createChannelSchema };
