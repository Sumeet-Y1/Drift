const uploadService = require('../services/uploadService');
const { getUploadUrlSchema } = require('../validators/uploadValidator');

async function getUploadUrlController(req, res) {
  const parsed = getUploadUrlSchema.parse(req.body);
  const result = await uploadService.getUploadUrl(req.user.userId, parsed.fileName, parsed.fileType, parsed.fileSize);
  res.status(200).json(result);
}

module.exports = { getUploadUrlController };