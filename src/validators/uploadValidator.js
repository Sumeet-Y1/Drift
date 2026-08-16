const { z } = require('zod');

const getUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
});

const setAvatarSchema = z.object({
  fileKey: z.string().min(1),
});

module.exports = { getUploadUrlSchema, setAvatarSchema };