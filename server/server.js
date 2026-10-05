import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db.js';
import { setupSockets } from './sockets/signalingHandler.js';
import { apiRouter } from './routes/api.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Relax CSP & DevTools headers for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * ws: wss:;"
  );
  next();
});

// Chrome DevTools probe handler to prevent 404 & CSP warnings
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(200).json({});
});

// Cross-Origin configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Root route friendly guidance
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Smart Rural Telemedicine API</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #f6faf7; color: #1f5c45; padding: 40px; text-align: center; }
        .card { background: white; max-width: 600px; margin: 0 auto; padding: 32px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        a { color: white; background: #1f5c45; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🩺 Health Kiosk Backend Running</h1>
        <p>This is the Express + Socket.io API server on port 5000.</p>
        <p>The <strong>Frontend Kiosk UI</strong> is running on the client port:</p>
        <a href="http://localhost:5174" target="_blank">Open Kiosk UI (http://localhost:5174)</a>
        <br><br>
        <p><small>Or check API Health: <a style="background:#e8a317;" href="/api/health">/api/health</a></small></p>
      </div>
    </body>
    </html>
  `);
});

// Socket.io for WebRTC signaling and real-time triage alerts
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSockets(io);

// Make io accessible in request context if needed
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Connect DB and Start Server
async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Rural Telemedicine Kiosk Backend listening on port ${PORT}`);
    console.log(`📡 Socket.io ready for WebRTC signaling & emergency alerts`);
    console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);
  });
}

startServer();
