const userService = require('../services/userService');
const { setAvatarSchema } = require('../validators/uploadValidator');

async function getProfileController(req, res) {
  const user = await userService.getProfile(req.user.userId);
  res.status(200).json(user);
}

async function setAvatarController(req, res) {
  const parsed = setAvatarSchema.parse(req.body);
  const user = await userService.setAvatar(req.user.userId, parsed.fileKey);
  res.status(200).json(user);
}

module.exports = { getProfileController, setAvatarController };