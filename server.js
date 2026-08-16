const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const initChatSockets = require('./src/sockets/chat');
const { setSocketIO } = require('./src/routes/webhooks');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initChatSockets(io);
setSocketIO(io);

server.listen(PORT, () => {
  console.log('Drift server running on http://localhost:' + PORT);
});