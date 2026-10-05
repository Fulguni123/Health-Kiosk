export function setupSockets(io) {
  const activeRooms = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Join consult room
    socket.on('join-room', ({ roomId, role, userName }) => {
      socket.join(roomId);
      console.log(`[Socket] User ${socket.id} (${role || 'user'}) joined room: ${roomId}`);
      
      // Notify other peers in room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        role,
        userName
      });
    });

    // WebRTC Signaling Relay
    socket.on('signal', ({ roomId, target, signal, senderData }) => {
      if (target) {
        io.to(target).emit('signal', {
          sender: socket.id,
          signal,
          senderData
        });
      } else {
        socket.to(roomId).emit('signal', {
          sender: socket.id,
          signal,
          senderData
        });
      }
    });

    // Chat Relay
    socket.on('chat-message', ({ roomId, message, sender }) => {
      io.in(roomId).emit('chat-message', {
        sender,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // Emergency Broadcast to Doctor Dashboard
    socket.on('emergency-alert', (alertData) => {
      console.log('🚨 EMERGENCY BROADCAST:', alertData);
      io.emit('doctor-emergency-alert', {
        ...alertData,
        receivedAt: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      io.emit('user-disconnected', { socketId: socket.id });
    });
  });
}
