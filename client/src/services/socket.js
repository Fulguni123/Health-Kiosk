import { io } from 'socket.io-client';

// Connect to backend server
const URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';

export const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

export default socket;
