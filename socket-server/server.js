require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve admin interface
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active sessions
const activeSessions = new Map();

// Data directory path (for compatibility with PHP version)
const dataDir = path.join(__dirname, '../data');

// Message files directory for auto-injection
const messageDir = path.join(__dirname, 'messages');

// Ensure directories exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(messageDir)) {
  fs.mkdirSync(messageDir, { recursive: true });
  console.log(`Created message directory: ${messageDir}`);
}

// REST endpoint for checking server status
app.get('/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'WebRTC Socket server is running',
    activeSessions: Array.from(activeSessions.keys())
  });
});

// REST endpoint for injecting text into sessions
app.post('/inject-text', (req, res) => {
  const { sessionId, text, type = 'system' } = req.body;
  
  if (!sessionId || !text) {
    return res.status(400).json({
      status: 'error',
      message: 'sessionId and text are required'
    });
  }
  
  if (!activeSessions.has(sessionId)) {
    return res.status(404).json({
      status: 'error',
      message: `Session ${sessionId} not found or has no active clients`
    });
  }
  
  console.log(`Injecting text into session ${sessionId}: "${text}"`);
  
  // Broadcast the text injection to all clients in the session
  io.to(sessionId).emit('server-text-injection', {
    text: text,
    type: type,
    timestamp: Date.now(),
    injectedBy: 'server'
  });
  
  res.json({
    status: 'success',
    message: `Text injected into session ${sessionId}`,
    sessionId: sessionId,
    clientsNotified: activeSessions.get(sessionId).size
  });
});

// Debug endpoint to show active sessions
app.get('/debug/sessions', (req, res) => {
  const sessionInfo = {};
  for (const [sessionId, clients] of activeSessions.entries()) {
    sessionInfo[sessionId] = {
      clientCount: clients.size,
      clients: Array.from(clients.keys())
    };
  }
  res.json({
    totalSessions: activeSessions.size,
    sessions: sessionInfo
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  let sessionId = null;
  let clientId = null;

  // Handle client joining a session
  socket.on('join-session', ({ sessionId: sid, clientId: cid }) => {
    sessionId = sid;
    clientId = cid || socket.id; // Use socket ID as clientId if not provided
    
    console.log(`Client ${clientId} joined session ${sessionId}`);
    
    // Add client to session
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, new Map());
    }
    
    // Store client information
    activeSessions.get(sessionId).set(clientId, {
      socketId: socket.id,
      lastSeen: Date.now()
    });
    
    // Join room for this session
    socket.join(sessionId);
    
    // Notify everyone in the session about active users
    updateSessionStatus(sessionId);
    
    // Send user joined event to React app
    socket.to(sessionId).emit('user-joined', {
      users: Array.from(activeSessions.get(sessionId).keys())
    });
    
    // Send current user list to the new client
    socket.emit('user-joined', {
      users: Array.from(activeSessions.get(sessionId).keys())
    });
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ target, signal }) => {
    if (!sessionId || !clientId) {
      console.error('Client tried to send signal without joining a session');
      return;
    }

    console.log(`Signal from ${clientId} to ${target}`);

    if (target === 'all') {
      // Broadcast to all clients in this session except sender
      socket.to(sessionId).emit('signal', {
        from: clientId,
        signal
      });
    } else if (activeSessions.has(sessionId) && activeSessions.get(sessionId).has(target)) {
      // Send to specific client
      const targetSocketId = activeSessions.get(sessionId).get(target).socketId;
      io.to(targetSocketId).emit('signal', {
        from: clientId,
        signal
      });
    } else {
      console.warn(`Target client ${target} not found in session ${sessionId}`);
    }
  });

  // Handle presence announcements
  socket.on('presence', () => {
    if (!sessionId || !clientId) {
      console.error('Client tried to announce presence without joining a session');
      return;
    }
    
    console.log(`Presence announcement from ${clientId}`);
    
    // Update client's last seen timestamp
    if (activeSessions.has(sessionId) && activeSessions.get(sessionId).has(clientId)) {
      activeSessions.get(sessionId).get(clientId).lastSeen = Date.now();
    }
    
    // Respond with client list for this session
    socket.emit('client-list', getSessionClients(sessionId));
  });
  
  // Handle direct client list requests
  socket.on('get-clients', () => {
    if (!sessionId || !clientId) {
      console.error('Client tried to request client list without joining a session');
      return;
    }
    
    console.log(`Client list requested by ${clientId}`);
    
    // Respond with client list for this session
    socket.emit('client-list', getSessionClients(sessionId));
  });

  // Handle direct messages (WebRTC fallback mode)
  socket.on('direct-message', ({ target, message }) => {
    if (!sessionId || !clientId) {
      console.error('Client tried to send direct message without joining a session');
      return;
    }
    
    console.log(`Direct message from ${clientId} to ${target}`);
    
    if (target === 'all') {
      // Broadcast to all clients in this session except sender
      socket.to(sessionId).emit('direct-message', {
        from: clientId,
        message
      });
    } else if (activeSessions.has(sessionId) && activeSessions.get(sessionId).has(target)) {
      // Send to specific client
      const targetSocketId = activeSessions.get(sessionId).get(target).socketId;
      io.to(targetSocketId).emit('direct-message', {
        from: clientId,
        message
      });
    } else {
      console.warn(`Target client ${target} not found in session ${sessionId}`);
    }
  });
  
  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    if (sessionId && clientId) {
      if (activeSessions.has(sessionId)) {
        // Remove client from session
        activeSessions.get(sessionId).delete(clientId);
        
        // If session is empty, remove it
        if (activeSessions.get(sessionId).size === 0) {
          activeSessions.delete(sessionId);
        } else {
          // Notify remaining clients about user leaving
          io.to(sessionId).emit('user-left', {
            users: Array.from(activeSessions.get(sessionId).keys())
          });
          // Update session status for remaining clients
          updateSessionStatus(sessionId);
        }
      }
    }
  });
  
  // Handle document changes for collaborative editing
  socket.on('document-change', ({ sessionId: docSessionId, document }) => {
    if (!docSessionId) {
      console.error('No session ID provided for document change');
      return;
    }
    
    console.log(`Document updated in session ${docSessionId}`);
    
    // Broadcast document update to all other clients in the session
    socket.to(docSessionId).emit('document-update', {
      document: document,
      updatedBy: socket.id,
      timestamp: Date.now()
    });
  });

  // Handle explicit leave session
  socket.on('leave-session', () => {
    if (sessionId && clientId && activeSessions.has(sessionId)) {
      // Remove client from session
      activeSessions.get(sessionId).delete(clientId);
      
      // If session is empty, remove it
      if (activeSessions.get(sessionId).size === 0) {
        activeSessions.delete(sessionId);
      } else {
        // Otherwise update session status
        updateSessionStatus(sessionId);
      }
    }
    
    sessionId = null;
    clientId = null;
  });
});

// Function to update session status for all clients in a session
function updateSessionStatus(sessionId) {
  if (!activeSessions.has(sessionId)) return;
  
  const clients = getSessionClients(sessionId);
  const clientCount = clients.length;
  
  // Broadcast to all clients in this session
  io.to(sessionId).emit('session-update', {
    activeUsers: clientCount,
    clientList: clients
  });
}

// Function to get client list for a session
function getSessionClients(sessionId) {
  if (!activeSessions.has(sessionId)) return [];
  
  // Clean up stale clients (inactive for more than 30 seconds)
  const now = Date.now();
  const sessionClients = activeSessions.get(sessionId);
  
  // Filter out stale clients
  for (const [clientId, data] of sessionClients.entries()) {
    if (now - data.lastSeen > 30000) {
      sessionClients.delete(clientId);
    }
  }
  
  // Return list of client IDs
  return Array.from(sessionClients.keys());
}

// Periodically clean up inactive sessions and clients
setInterval(() => {
  const now = Date.now();
  
  // Check each session
  for (const [sessionId, clients] of activeSessions.entries()) {
    let hasActiveClients = false;
    
    // Check each client in this session
    for (const [clientId, data] of clients.entries()) {
      if (now - data.lastSeen < 30000) {
        hasActiveClients = true;
      } else {
        clients.delete(clientId);
      }
    }
    
    // If no active clients, remove the session
    if (!hasActiveClients) {
      activeSessions.delete(sessionId);
    }
  }
}, 10000); // Run every 10 seconds

// File watching for auto-injection
function setupFileWatcher() {
  console.log(`Watching for message files in: ${messageDir}`);
  console.log('File naming patterns:');
  console.log('  - <sessionId>.txt (default type: system)');
  console.log('  - <sessionId>_<type>.txt (e.g., abc123_bot.txt)');
  
  const watcher = chokidar.watch(messageDir, {
    ignored: /^\./, // ignore dotfiles
    persistent: true,
    ignoreInitial: true // don't trigger on existing files during startup
  });

  watcher.on('add', handleMessageFile);
  watcher.on('change', handleMessageFile);
  
  watcher.on('error', error => {
    console.error('File watcher error:', error);
  });
}

function handleMessageFile(filePath) {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(fileName);
  
  // Only process .txt files
  if (fileExt !== '.txt') {
    return;
  }
  
  console.log(`Processing message file: ${fileName}`);
  
  try {
    // Parse filename to extract session ID and message type
    const baseName = path.basename(fileName, '.txt');
    let sessionId, messageType;
    
    if (baseName.includes('_')) {
      // Format: sessionId_type.txt
      const parts = baseName.split('_');
      sessionId = parts[0];
      messageType = parts.slice(1).join('_'); // Handle multiple underscores
    } else {
      // Format: sessionId.txt
      sessionId = baseName;
      messageType = 'system';
    }
    
    // Check if session exists and has active clients
    if (!activeSessions.has(sessionId)) {
      console.log(`Session ${sessionId} not found or inactive, skipping file: ${fileName}`);
      return;
    }
    
    // Read file content
    const messageText = fs.readFileSync(filePath, 'utf8').trim();
    
    if (!messageText) {
      console.log(`Empty message file: ${fileName}`);
      return;
    }
    
    console.log(`Injecting message from file ${fileName} into session ${sessionId}`);
    console.log(`Message type: ${messageType}`);
    console.log(`Message: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`);
    
    // Inject the message into the session
    io.to(sessionId).emit('server-text-injection', {
      text: messageText,
      type: messageType,
      timestamp: Date.now(),
      injectedBy: 'file-watcher',
      source: fileName
    });
    
    // Move processed file to processed directory
    const processedDir = path.join(messageDir, 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const processedFileName = `${timestamp}_${fileName}`;
    const processedPath = path.join(processedDir, processedFileName);
    
    fs.renameSync(filePath, processedPath);
    console.log(`File processed and moved to: ${processedFileName}`);
    
  } catch (error) {
    console.error(`Error processing message file ${fileName}:`, error);
  }
}

// Initialize file watcher
setupFileWatcher();

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
