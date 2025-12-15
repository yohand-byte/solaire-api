import { Server } from 'socket.io';
import { setIo } from './io';

export function setupWebsocket(httpServer: any) {
  const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
  setIo(io);
  io.on('connection', (socket) => {
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
  return io;
}
