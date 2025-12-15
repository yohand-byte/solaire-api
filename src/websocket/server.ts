import { Server } from 'socket.io';

export function setupWebsocket(httpServer: any) {
  const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
  io.on('connection', (socket) => {
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
  return io;
}
