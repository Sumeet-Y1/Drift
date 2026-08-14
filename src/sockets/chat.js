const { verifyToken } = require('../utils/token');
const prisma = require('../config/db');
const messageService = require('../services/messageService');
const conversationService = require('../services/conversationService');

function initChatSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected: ' + socket.user.username + ' (' + socket.id + ')');

    // --- Server channel events ---

    socket.on('join_channel', async (channelId) => {
      try {
        const channel = await prisma.channel.findUnique({ where: { id: channelId } });

        if (!channel) {
          socket.emit('error_message', 'Channel not found');
          return;
        }

        const membership = await prisma.membership.findUnique({
          where: {
            userId_serverId: { userId: socket.user.userId, serverId: channel.serverId },
          },
        });

        if (!membership) {
          socket.emit('error_message', 'Not a member of this server');
          return;
        }

        socket.join('channel:' + channelId);
        socket.emit('joined_channel', channelId);
      } catch (err) {
        socket.emit('error_message', 'Failed to join channel');
      }
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave('channel:' + channelId);
    });

    socket.on('send_message', async ({ channelId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const message = await messageService.createMessage(socket.user.userId, channelId, content);

        io.to('channel:' + channelId).emit('new_message', message);
      } catch (err) {
        socket.emit('error_message', err.message || 'Failed to send message');
      }
    });

    // --- Direct message / conversation events ---

    socket.on('join_conversation', async (conversationId) => {
      try {
        await conversationService.assertMember(socket.user.userId, conversationId);
        socket.join('conversation:' + conversationId);
        socket.emit('joined_conversation', conversationId);
      } catch (err) {
        socket.emit('error_message', err.message || 'Failed to join conversation');
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave('conversation:' + conversationId);
    });

    socket.on('send_dm', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const message = await conversationService.createMessage(socket.user.userId, conversationId, content);

        io.to('conversation:' + conversationId).emit('new_dm', message);
      } catch (err) {
        socket.emit('error_message', err.message || 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected: ' + socket.user.username + ' (' + socket.id + ')');
    });
  });
}

module.exports = initChatSockets;