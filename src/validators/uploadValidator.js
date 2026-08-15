const { z } = require('zod');

const getUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
});

module.exports = { getUploadUrlSchema };