const serverService = require('../services/serverService');
const { createServerSchema, createChannelSchema } = require('../validators/serverValidator');

async function createServerController(req, res) {
  const parsed = createServerSchema.parse(req.body);
  const server = await serverService.createServer(req.user.userId, parsed.name);
  res.status(201).json(server);
}

async function joinServerController(req, res) {
  const server = await serverService.joinServer(req.user.userId, req.params.inviteCode);
  res.status(200).json(server);
}

async function listUserServersController(req, res) {
  const servers = await serverService.listUserServers(req.user.userId);
  res.status(200).json(servers);
}

async function createChannelController(req, res) {
  const parsed = createChannelSchema.parse(req.body);
  const channel = await serverService.createChannel(req.user.userId, req.params.serverId, parsed.name, parsed.type);
  res.status(201).json(channel);
}

async function listChannelsController(req, res) {
  const channels = await serverService.listChannels(req.user.userId, req.params.serverId);
  res.status(200).json(channels);
}

async function leaveServerController(req, res) {
  const result = await serverService.leaveServer(req.user.userId, req.params.serverId);
  res.status(200).json(result);
}

async function kickMemberController(req, res) {
  const result = await serverService.kickMember(req.user.userId, req.params.serverId, req.params.userId);
  res.status(200).json(result);
}

async function deleteServerController(req, res) {
  const result = await serverService.deleteServer(req.user.userId, req.params.serverId);
  res.status(200).json(result);
}

module.exports = {
  createServerController,
  joinServerController,
  listUserServersController,
  createChannelController,
  listChannelsController,
  leaveServerController,
  kickMemberController,
  deleteServerController,
};
