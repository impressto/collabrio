require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const crypto = require('crypto');
const multer = require('multer');
const mime = require('mime-types');
const { CohereClientV2 } = require('cohere-ai');
const sqlite3 = require('sqlite3').verbose();

// Initialize Cohere AI client
const cohere = new CohereClientV2({ 
  token: process.env.COHERE_API_KEY || null
});

// Initialize SQLite database for session persistence
const dbPath = path.join(__dirname, 'sessions.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database for session persistence');
    
    // Create sessions table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        document_content TEXT NOT NULL,
        last_updated INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating sessions table:', err.message);
      } else {
        console.log('Sessions table ready');
      }
    });
  }
});

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve admin interface
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Get valid school registration numbers from environment
const getValidSchoolNumbers = () => {
  const envNumbers = process.env.VALID_SCHOOL_NUMBERS || '906484,894362';
  return envNumbers.split(',').map(num => num.trim());
};

// Valid school registration numbers for authentication
const VALID_SCHOOL_NUMBERS = getValidSchoolNumbers();

// School validation endpoint
app.post('/validate-school', (req, res) => {
  const { schoolNumber } = req.body;
  
  if (!schoolNumber) {
    return res.status(400).json({ valid: false, error: 'School number required' });
  }
  
  // Validate format (6 digits)
  if (!/^\d{6}$/.test(schoolNumber)) {
    return res.status(400).json({ valid: false, error: 'Invalid format' });
  }
  
  // Check if school number is in valid list
  const isValid = VALID_SCHOOL_NUMBERS.includes(schoolNumber);
  
  console.log(`School validation attempt: ${schoolNumber} - ${isValid ? 'VALID' : 'INVALID'}`);
  
  res.json({ 
    valid: isValid,
    message: isValid ? 'School registration valid' : 'Invalid school registration number'
  });
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

// Store session documents (sessionId -> document content)
const sessionDocuments = new Map();

// Store active file transfers (fileId -> file metadata and chunks)
const activeFiles = new Map();

// Store session file uploads tracking (sessionId -> Set of fileIds)
const sessionFiles = new Map();

// Database functions for session persistence
function saveSessionToDatabase(sessionId, documentContent) {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    db.run(
      `INSERT OR REPLACE INTO sessions (id, document_content, last_updated, created_at) 
       VALUES (?, ?, ?, COALESCE((SELECT created_at FROM sessions WHERE id = ?), ?))`,
      [sessionId, documentContent, now, sessionId, now],
      function(err) {
        if (err) {
          console.error('Error saving session to database:', err.message);
          reject(err);
        } else {
          console.log(`Session ${sessionId} saved to database`);
          resolve();
        }
      }
    );
  });
}

function loadSessionFromDatabase(sessionId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT document_content, last_updated FROM sessions WHERE id = ?',
      [sessionId],
      (err, row) => {
        if (err) {
          console.error('Error loading session from database:', err.message);
          reject(err);
        } else {
          resolve(row ? row.document_content : null);
        }
      }
    );
  });
}

function cleanupOldSessions() {
  const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
  db.run(
    'DELETE FROM sessions WHERE last_updated < ?',
    [cutoffTime],
    function(err) {
      if (err) {
        console.error('Error cleaning up old sessions:', err.message);
      } else {
        console.log(`Cleaned up ${this.changes} old sessions from database`);
      }
    }
  );
}

// Clean up old sessions on startup and then every 24 hours
cleanupOldSessions();
setInterval(cleanupOldSessions, 24 * 60 * 60 * 1000);

// Debouncing for document saves (sessionId -> timeout)
const saveTimeouts = new Map();

function debouncedSaveSession(sessionId, documentContent, delay = 5000) {
  // Clear existing timeout for this session
  if (saveTimeouts.has(sessionId)) {
    clearTimeout(saveTimeouts.get(sessionId));
  }
  
  // Set new timeout
  const timeout = setTimeout(() => {
    if (documentContent && documentContent.trim().length > 0) {
      saveSessionToDatabase(sessionId, documentContent)
        .then(() => {
          console.log(`Document auto-saved to database for session ${sessionId}`);
        })
        .catch((error) => {
          console.error(`Failed to auto-save document for session ${sessionId}:`, error);
        });
    }
    saveTimeouts.delete(sessionId);
  }, delay);
  
  saveTimeouts.set(sessionId, timeout);
}

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

// File sharing configuration
const FILE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  timeoutMinutes: 5,
  chunkSize: 64 * 1024, // 64KB
  maxUploadsPerUser: 3,
  uploadWindowMinutes: 5,
  allowedTypes: [
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
    // Archives
    'application/zip', 'application/x-tar', 'application/gzip',
    // Code
    'application/javascript', 'text/javascript', 'text/css', 'text/html', 'application/json'
  ],
  blockedExtensions: ['.exe', '.bat', '.sh', '.app', '.dll', '.sys', '.scr', '.vbs', '.jar']
};

// Rate limiting for file uploads (userId -> upload timestamps)
const uploadRateLimits = new Map();

// File sharing helper functions
function generateFileId() {
  return crypto.randomBytes(16).toString('hex');
}

function validateFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();
  
  // Check blocked extensions
  if (FILE_CONFIG.blockedExtensions.includes(ext)) {
    return { valid: false, reason: `File type ${ext} is not allowed` };
  }
  
  // Check allowed MIME types
  if (!FILE_CONFIG.allowedTypes.includes(mimeType)) {
    return { valid: false, reason: `MIME type ${mimeType} is not allowed` };
  }
  
  return { valid: true };
}

function checkUploadRateLimit(userId) {
  const now = Date.now();
  const windowStart = now - (FILE_CONFIG.uploadWindowMinutes * 60 * 1000);
  
  if (!uploadRateLimits.has(userId)) {
    uploadRateLimits.set(userId, []);
  }
  
  const userUploads = uploadRateLimits.get(userId);
  
  // Remove old uploads outside the window
  const recentUploads = userUploads.filter(timestamp => timestamp > windowStart);
  uploadRateLimits.set(userId, recentUploads);
  
  return recentUploads.length < FILE_CONFIG.maxUploadsPerUser;
}

function addUploadToRateLimit(userId) {
  const now = Date.now();
  if (!uploadRateLimits.has(userId)) {
    uploadRateLimits.set(userId, []);
  }
  uploadRateLimits.get(userId).push(now);
}

function cleanupExpiredFiles() {
  const now = Date.now();
  const expiredFiles = [];
  
  for (const [fileId, fileData] of activeFiles.entries()) {
    if (now - fileData.uploadTimestamp > FILE_CONFIG.timeoutMinutes * 60 * 1000) {
      expiredFiles.push(fileId);
    }
  }
  
  for (const fileId of expiredFiles) {
    console.log(`Cleaning up expired file: ${fileId}`);
    activeFiles.delete(fileId);
    
    // Remove from session tracking
    for (const [sessionId, fileSet] of sessionFiles.entries()) {
      fileSet.delete(fileId);
    }
    
    // Notify session participants that file expired
    const sessionId = activeFiles.get(fileId)?.sessionId;
    if (sessionId && activeSessions.has(sessionId)) {
      io.to(sessionId).emit('file-expired', { fileId });
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredFiles, 60 * 1000);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_CONFIG.maxFileSize,
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    const validation = validateFileType(file.originalname, file.mimetype);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.reason));
    }
  }
});

// Phase 1: File upload endpoint
app.post('/upload-file', upload.single('file'), (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    if (!sessionId || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'sessionId and userId are required'
      });
    }
    
    if (!activeSessions.has(sessionId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found or inactive'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided'
      });
    }
    
    // Check upload rate limit
    if (!checkUploadRateLimit(userId)) {
      return res.status(429).json({
        status: 'error',
        message: `Upload limit exceeded. Maximum ${FILE_CONFIG.maxUploadsPerUser} uploads per ${FILE_CONFIG.uploadWindowMinutes} minutes.`
      });
    }
    
    // Generate file ID and store file data
    const fileId = generateFileId();
    const fileData = {
      id: fileId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
      uploadTimestamp: Date.now(),
      sessionId: sessionId,
      uploadedBy: userId,
      downloadCount: 0
    };
    
    // Store file in memory
    activeFiles.set(fileId, fileData);
    
    // Track file for session
    if (!sessionFiles.has(sessionId)) {
      sessionFiles.set(sessionId, new Set());
    }
    sessionFiles.get(sessionId).add(fileId);
    
    // Add to rate limit tracking
    addUploadToRateLimit(userId);
    
    console.log(`File uploaded: ${req.file.originalname} (${req.file.size} bytes) by ${userId} in session ${sessionId}`);
    
    // Get uploader's username from active session
    const uploaderInfo = activeSessions.get(sessionId)?.get(userId);
    const uploaderUsername = uploaderInfo?.username || 'Anonymous User';

    // Notify all session participants about new file
    io.to(sessionId).emit('file-available', {
      fileId: fileId,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: userId,
      uploaderUsername: uploaderUsername,
      timestamp: Date.now()
    });
    
    res.json({
      status: 'success',
      message: 'File uploaded successfully',
      fileId: fileId,
      filename: req.file.originalname,
      size: req.file.size
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'File upload failed'
    });
  }
});

// Phase 1: File download endpoint
app.get('/download-file/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'sessionId query parameter is required'
      });
    }
    
    if (!activeSessions.has(sessionId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found or inactive'
      });
    }
    
    const fileData = activeFiles.get(fileId);
    if (!fileData) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found or expired'
      });
    }
    
    if (fileData.sessionId !== sessionId) {
      return res.status(403).json({
        status: 'error',
        message: 'File not accessible from this session'
      });
    }
    
    // Increment download count
    fileData.downloadCount++;
    
    console.log(`File downloaded: ${fileData.filename} (download #${fileData.downloadCount}) from session ${sessionId}`);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Length', fileData.size);
    
    // Send file buffer
    res.send(fileData.buffer);
    
    // Notify session participants about download
    io.to(sessionId).emit('file-downloaded', {
      fileId: fileId,
      filename: fileData.filename,
      downloadCount: fileData.downloadCount,
      timestamp: Date.now()
    });
    
    // Optional: Clean up file after first download (ephemeral behavior)
    // Uncomment the following lines if you want files to be deleted after download
    /*
    activeFiles.delete(fileId);
    if (sessionFiles.has(sessionId)) {
      sessionFiles.get(sessionId).delete(fileId);
    }
    console.log(`File cleaned up after download: ${fileId}`);
    */
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      status: 'error',
      message: 'File download failed'
    });
  }
});

// REST endpoint for checking server status
app.get('/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'WebRTC Socket server is running',
    activeSessions: Array.from(activeSessions.keys()),
    activeFiles: activeFiles.size
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

  // Helper function to update client activity timestamp
  const updateClientActivity = (targetSessionId = null, targetClientId = null) => {
    const activeSessionId = targetSessionId || sessionId;
    const activeClientId = targetClientId || clientId;
    
    if (activeSessionId && activeClientId && activeSessions.has(activeSessionId) && activeSessions.get(activeSessionId).has(activeClientId)) {
      activeSessions.get(activeSessionId).get(activeClientId).lastSeen = Date.now();
    }
  };

  // Handle client joining a session
  socket.on('join-session', ({ sessionId: sid, clientId: cid, userIdentity, schoolAuth }) => {
    // Validate school authentication first
    if (!schoolAuth || !VALID_SCHOOL_NUMBERS.includes(schoolAuth)) {
      console.log(`Unauthorized join attempt - invalid school auth: ${schoolAuth}`);
      socket.emit('auth-error', { 
        message: 'Invalid school authentication. Please verify your school registration number.',
        code: 'INVALID_SCHOOL_AUTH'
      });
      return;
    }

    sessionId = sid;
    clientId = cid || socket.id; // Use socket ID as clientId if not provided
    
    console.log(`Client ${clientId} (${userIdentity?.username || 'Anonymous'}) from school ${schoolAuth} joined session ${sessionId}`);
    
    // Add client to session
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, new Map());
    }
    
    // Resolve identity conflicts
    const sessionUsers = Array.from(activeSessions.get(sessionId).values());
    const takenUsernames = sessionUsers.map(user => user.username).filter(Boolean);
    const takenAvatars = sessionUsers.map(user => user.avatar).filter(Boolean);
    
    let finalUsername = userIdentity?.username || 'Anonymous User';
    let finalAvatar = userIdentity?.avatar || '👤';
    
    // Handle username conflicts
    if (takenUsernames.includes(finalUsername)) {
      let counter = 2;
      let uniqueUsername = `${finalUsername} ${counter}`;
      while (takenUsernames.includes(uniqueUsername)) {
        counter++;
        uniqueUsername = `${finalUsername} ${counter}`;
      }
      finalUsername = uniqueUsername;
    }
    
    // Handle avatar conflicts
    if (takenAvatars.includes(finalAvatar)) {
      const avatarOptions = ['🐱', '🐶', '🐺', '🦊', '🐸', '🐢', '🦉', '🐧', '🐘', '🦁', '⚡', '🌟', '🎯', '🎨', '🚀', '🎸', '⚽', '🎭', '🎲', '⭐', '🌺', '🌲', '🍄', '🌙', '☀️', '🌊', '🔥', '❄️', '🌈', '🍀'];
      const availableAvatars = avatarOptions.filter(avatar => !takenAvatars.includes(avatar));
      finalAvatar = availableAvatars.length > 0 ? availableAvatars[0] : '👤';
    }
    
    // Store client information with identity
    activeSessions.get(sessionId).set(clientId, {
      id: clientId,
      socketId: socket.id,
      username: finalUsername,
      avatar: finalAvatar,
      schoolNumber: schoolAuth,
      lastSeen: Date.now()
    });
    
    // Join room for this session
    socket.join(sessionId);
    
    // Set up regular heartbeat for this client to ensure activity tracking
    const heartbeatInterval = setInterval(() => {
      updateClientActivity();
    }, 15000); // Update every 15 seconds
    
    // Store the interval so we can clear it on disconnect
    socket.heartbeatInterval = heartbeatInterval;
    
    // Notify everyone in the session about active users
    updateSessionStatus(sessionId);
    
    // Get current user list with identities
    const currentUsers = Array.from(activeSessions.get(sessionId).values()).map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      schoolNumber: user.schoolNumber
    }));
    
    // Send user joined event to React app
    socket.to(sessionId).emit('user-joined', {
      users: currentUsers
    });
    
    // Send current user list to the new client
    socket.emit('user-joined', {
      users: currentUsers
    });
    
    // Send current document content to the new client
    if (sessionDocuments.has(sessionId)) {
      // Document is in memory
      const currentDocument = sessionDocuments.get(sessionId);
      console.log(`Sending current document to new client ${clientId} in session ${sessionId}`);
      socket.emit('document-update', {
        document: currentDocument,
        updatedBy: 'server',
        timestamp: Date.now(),
        isInitialLoad: true
      });
    } else {
      // Document not in memory, try to load from database
      loadSessionFromDatabase(sessionId)
        .then((documentContent) => {
          if (documentContent) {
            console.log(`Loaded document from database for session ${sessionId}`);
            // Store in memory for other clients joining
            sessionDocuments.set(sessionId, documentContent);
            // Send to the new client
            socket.emit('document-update', {
              document: documentContent,
              updatedBy: 'server',
              timestamp: Date.now(),
              isInitialLoad: true
            });
          } else {
            console.log(`No saved document found for session ${sessionId}`);
            // Send empty document
            socket.emit('document-update', {
              document: '',
              updatedBy: 'server',
              timestamp: Date.now(),
              isInitialLoad: true
            });
          }
        })
        .catch((error) => {
          console.error(`Error loading document for session ${sessionId}:`, error);
          // Send empty document on error
          socket.emit('document-update', {
            document: '',
            updatedBy: 'server',
            timestamp: Date.now(),
            isInitialLoad: true
          });
        });
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ target, signal }) => {
    if (!sessionId || !clientId) {
      console.error('Client tried to send signal without joining a session');
      return;
    }

    updateClientActivity();
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
    updateClientActivity();
    
    // Respond with client list for this session
    socket.emit('client-list', getSessionClients(sessionId));
  });
  
  // Handle direct client list requests
  socket.on('get-clients', () => {
    if (!sessionId || !clientId) {
      console.error('Client tried to request client list without joining a session');
      return;
    }
    
    updateClientActivity();
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
    
    updateClientActivity();
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
    
    // Clear heartbeat interval
    if (socket.heartbeatInterval) {
      clearInterval(socket.heartbeatInterval);
    }
    
    if (sessionId && clientId) {
      if (activeSessions.has(sessionId)) {
        // Remove client from session
        activeSessions.get(sessionId).delete(clientId);
        
        // If session is empty, save document to database and remove from memory
        if (activeSessions.get(sessionId).size === 0) {
          activeSessions.delete(sessionId);
          
          // Save document to database before removing from memory
          const documentContent = sessionDocuments.get(sessionId);
          if (documentContent && documentContent.trim().length > 0) {
            saveSessionToDatabase(sessionId, documentContent)
              .then(() => {
                console.log(`Document saved to database for session ${sessionId} before cleanup`);
              })
              .catch((error) => {
                console.error(`Failed to save document for session ${sessionId}:`, error);
              });
          }
          
          // Remove the stored document from memory
          sessionDocuments.delete(sessionId);
          console.log(`Cleaned up memory storage for empty session ${sessionId}`);
        } else {
          // Get current user list with identities
          const currentUsers = Array.from(activeSessions.get(sessionId).values()).map(user => ({
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            schoolNumber: user.schoolNumber
          }));
          
          // Notify remaining clients about user leaving
          io.to(sessionId).emit('user-left', {
            users: currentUsers
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
    
    // Server-side character limit validation
    const MAX_DOCUMENT_CHARS = parseInt(process.env.MAX_DOCUMENT_CHARS) || 20000;
    if (document && document.length > MAX_DOCUMENT_CHARS) {
      console.warn(`Document too large: ${document.length} characters (limit: ${MAX_DOCUMENT_CHARS})`);
      socket.emit('document-limit-exceeded', { 
        limit: MAX_DOCUMENT_CHARS, 
        currentLength: document.length,
        message: `Document exceeds ${MAX_DOCUMENT_CHARS} character limit`
      });
      return;
    }
    
    console.log(`Document updated in session ${docSessionId}`);
    
    // Update client's last seen timestamp for activity tracking
    // Use the docSessionId from the event and the current socket's clientId
    updateClientActivity(docSessionId, clientId || socket.id);
    
    // Store the updated document content for this session
    sessionDocuments.set(docSessionId, document);
    
    // Auto-save to database (debounced)
    debouncedSaveSession(docSessionId, document);
    
    // Broadcast document update to all other clients in the session
    socket.to(docSessionId).emit('document-update', {
      document: document,
      updatedBy: socket.id,
      timestamp: Date.now()
    });
  });

  socket.on('ask-ai', async ({ sessionId: aiSessionId, selectedText }) => {
    if (!aiSessionId) {
      console.error('No session ID provided for AI request');
      return;
    }
    
    if (!selectedText || selectedText.trim() === '') {
      console.error('No selected text provided for AI request');
      return;
    }
    
    console.log(`AI request in session ${aiSessionId} for text: "${selectedText.substring(0, 100)}..."`);
    
    // Update client's last seen timestamp for activity tracking
    updateClientActivity(aiSessionId, clientId || socket.id);
    
    // Get current document content
    const currentDocument = sessionDocuments.get(aiSessionId) || '';
    
    // First, append "Asking AI ... waiting for response" to the document
    const initialResponse = '\n\n[AI Query: "' + selectedText.trim() + '"]\nAsking AI ... waiting for response\n';
    const waitingDocument = currentDocument + initialResponse;
    
    // Store and broadcast the "waiting" state
    sessionDocuments.set(aiSessionId, waitingDocument);
    io.to(aiSessionId).emit('document-update', {
      document: waitingDocument,
      updatedBy: 'ai-system',
      timestamp: Date.now()
    });
    
    try {
      // Call Cohere AI API
      const response = await cohere.chat({
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": selectedText.trim()
              }
            ]
          }
        ],
        temperature: 0.3,
        model: process.env.COHERE_MODEL || "command-a-03-2025",
        safety_mode: "STRICT"
      });
      
      // Log Cohere API response metadata (excluding message content for debugging)
      const responseMetadata = {
        ...response,
        message: response.message ? {
          role: response.message.role,
          contentType: response.message.content?.[0]?.type,
          contentLength: response.message.content?.[0]?.text?.length || 0
        } : null
      };
      console.log('Cohere API Response Metadata:', JSON.stringify(responseMetadata, null, 2));
      
      // Extract the AI response text
      const aiResponseText = response.message?.content?.[0]?.text || 'AI response unavailable';
      
      // Replace "waiting for response" with actual AI response
      const finalResponse = '\n\n[AI Query: "' + selectedText.trim() + '"]\n[AI Response: ' + aiResponseText + ']\n';
      const finalDocument = currentDocument + finalResponse;
      
      // Store and broadcast the final response
      sessionDocuments.set(aiSessionId, finalDocument);
      io.to(aiSessionId).emit('document-update', {
        document: finalDocument,
        updatedBy: 'ai-system',
        timestamp: Date.now()
      });
      
      console.log(`AI response delivered to session ${aiSessionId}`);
      
    } catch (error) {
      console.error('Cohere AI API error:', error);
      
      // Replace "waiting for response" with error message
      const errorResponse = '\n\n[AI Query: "' + selectedText.trim() + '"]\n[AI Error: Unable to get AI response. Please try again.]\n';
      const errorDocument = currentDocument + errorResponse;
      
      // Store and broadcast the error
      sessionDocuments.set(aiSessionId, errorDocument);
      io.to(aiSessionId).emit('document-update', {
        document: errorDocument,
        updatedBy: 'ai-system',
        timestamp: Date.now()
      });
    }
  });

  // Handle direct AI requests (for silent injection)
  socket.on('ask-ai-direct', async ({ sessionId: aiSessionId, selectedText, requestId }) => {
    if (!aiSessionId) {
      console.error('No session ID provided for direct AI request');
      return;
    }
    
    if (!selectedText || selectedText.trim() === '') {
      console.error('No selected text provided for direct AI request');
      return;
    }
    
    console.log(`Direct AI request in session ${aiSessionId} with requestId ${requestId} for text: "${selectedText.substring(0, 100)}..."`);
    
    // Update client's last seen timestamp for activity tracking
    updateClientActivity(aiSessionId, clientId || socket.id);
    
    try {
      // Call Cohere AI API
      const response = await cohere.chat({
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": selectedText.trim()
              }
            ]
          }
        ],
        temperature: 0.3,
        model: process.env.COHERE_MODEL || "command-a-03-2025",
        safety_mode: "STRICT"
      });
      
      // Extract the AI response text
      let aiResponseText = response.message?.content?.[0]?.text || 'AI response unavailable';
      
      // Remove surrounding quotes if they exist
      aiResponseText = aiResponseText.trim();
      if ((aiResponseText.startsWith('"') && aiResponseText.endsWith('"')) ||
          (aiResponseText.startsWith("'") && aiResponseText.endsWith("'"))) {
        aiResponseText = aiResponseText.slice(1, -1);
      }
      
      console.log(`Direct AI response ready for requestId ${requestId}`);
      
      // Send the response directly back to the requesting client (not to the entire session)
      socket.emit('ai-response-direct', {
        requestId: requestId,
        response: aiResponseText,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Cohere AI API error for direct request:', error);
      
      // Send error response back to the requesting client
      socket.emit('ai-response-direct', {
        requestId: requestId,
        response: 'Unable to generate icebreaker. Please try again.',
        error: true,
        timestamp: Date.now()
      });
    }
  });

  // Handle file sharing events
  socket.on('file-share-request', ({ filename, size, mimeType, sessionId: requestSessionId }) => {
    // Use sessionId from request if provided, otherwise fall back to socket's sessionId
    const activeSessionId = requestSessionId || sessionId;
    const activeClientId = clientId || socket.id;
    
    if (!activeSessionId || !activeClientId) {
      socket.emit('file-share-error', { message: 'Must be in a session to share files' });
      return;
    }
    
    updateClientActivity();
    
    // Validate that the session actually exists and is active
    if (!activeSessions.has(activeSessionId)) {
      socket.emit('file-share-error', { message: 'Session not found or inactive' });
      return;
    }
    
    // Validate file before accepting
    const validation = validateFileType(filename, mimeType);
    if (!validation.valid) {
      socket.emit('file-share-error', { message: validation.reason });
      return;
    }
    
    if (size > FILE_CONFIG.maxFileSize) {
      socket.emit('file-share-error', { 
        message: `File too large. Maximum size is ${FILE_CONFIG.maxFileSize / 1024 / 1024}MB` 
      });
      return;
    }
    
    // Check rate limit
    if (!checkUploadRateLimit(activeClientId)) {
      socket.emit('file-share-error', { 
        message: `Upload limit exceeded. Maximum ${FILE_CONFIG.maxUploadsPerUser} uploads per ${FILE_CONFIG.uploadWindowMinutes} minutes.` 
      });
      return;
    }
    
    // Generate file ID for this transfer
    const fileId = generateFileId();
    
    // Initialize file transfer tracking
    activeFiles.set(fileId, {
      id: fileId,
      filename: filename,
      mimeType: mimeType,
      size: size,
      sessionId: activeSessionId,
      uploadedBy: activeClientId,
      uploadTimestamp: Date.now(),
      chunks: new Map(),
      totalChunks: Math.ceil(size / FILE_CONFIG.chunkSize),
      receivedChunks: 0,
      buffer: null,
      isComplete: false
    });
    
    console.log(`File share initiated: ${filename} (${size} bytes) by ${activeClientId} in session ${activeSessionId}`);
    
    // Respond with file ID for chunked upload
    socket.emit('file-share-accepted', { 
      fileId: fileId,
      chunkSize: FILE_CONFIG.chunkSize
    });
  });
  
  socket.on('file-chunk', ({ fileId, chunkIndex, chunkData, isLastChunk }) => {
    const fileTransfer = activeFiles.get(fileId);
    if (!fileTransfer) {
      socket.emit('file-share-error', { message: 'File transfer not found or expired' });
      return;
    }
    
    if (fileTransfer.sessionId !== sessionId || fileTransfer.uploadedBy !== clientId) {
      socket.emit('file-share-error', { message: 'Invalid file transfer session' });
      return;
    }
    
    // Convert base64 chunk data to buffer
    const chunkBuffer = Buffer.from(chunkData, 'base64');
    
    // Store chunk
    fileTransfer.chunks.set(chunkIndex, chunkBuffer);
    fileTransfer.receivedChunks++;
    
    console.log(`Received chunk ${chunkIndex + 1}/${fileTransfer.totalChunks} for file ${fileTransfer.filename}`);
    
    // Send progress update
    socket.emit('file-upload-progress', {
      fileId: fileId,
      progress: (fileTransfer.receivedChunks / fileTransfer.totalChunks) * 100,
      receivedChunks: fileTransfer.receivedChunks,
      totalChunks: fileTransfer.totalChunks
    });
    
    // Check if all chunks received
    if (fileTransfer.receivedChunks === fileTransfer.totalChunks || isLastChunk) {
      // Reassemble file from chunks
      const sortedChunks = [];
      for (let i = 0; i < fileTransfer.totalChunks; i++) {
        if (fileTransfer.chunks.has(i)) {
          sortedChunks.push(fileTransfer.chunks.get(i));
        }
      }
      
      if (sortedChunks.length === fileTransfer.totalChunks) {
        fileTransfer.buffer = Buffer.concat(sortedChunks);
        fileTransfer.isComplete = true;
        
        // Clear chunks to save memory
        fileTransfer.chunks.clear();
        
        // Add to rate limit tracking
        addUploadToRateLimit(clientId);
        
        // Track file for session
        if (!sessionFiles.has(sessionId)) {
          sessionFiles.set(sessionId, new Set());
        }
        sessionFiles.get(sessionId).add(fileId);
        
        console.log(`File upload completed: ${fileTransfer.filename} by ${clientId}`);
        
        // Notify uploader
        socket.emit('file-upload-complete', {
          fileId: fileId,
          filename: fileTransfer.filename,
          size: fileTransfer.size
        });
        
        // Get uploader's username from active session
        const uploaderInfo = activeSessions.get(sessionId)?.get(clientId);
        const uploaderUsername = uploaderInfo?.username || 'Anonymous User';

        // Notify all session participants about new file
        io.to(sessionId).emit('file-available', {
          fileId: fileId,
          filename: fileTransfer.filename,
          size: fileTransfer.size,
          mimeType: fileTransfer.mimeType,
          uploadedBy: clientId,
          uploaderUsername: uploaderUsername,
          timestamp: Date.now()
        });
      } else {
        socket.emit('file-share-error', { message: 'File assembly failed - missing chunks' });
      }
    }
  });
  
  socket.on('file-download-request', ({ fileId }) => {
    if (!sessionId || !clientId) {
      socket.emit('file-share-error', { message: 'Must be in a session to download files' });
      return;
    }
    
    const fileData = activeFiles.get(fileId);
    if (!fileData) {
      socket.emit('file-share-error', { message: 'File not found or expired' });
      return;
    }
    
    if (fileData.sessionId !== sessionId) {
      socket.emit('file-share-error', { message: 'File not accessible from this session' });
      return;
    }
    
    if (!fileData.isComplete) {
      socket.emit('file-share-error', { message: 'File upload not yet complete' });
      return;
    }
    
    // Provide download URL
    socket.emit('file-download-ready', {
      fileId: fileId,
      filename: fileData.filename,
      size: fileData.size,
      downloadUrl: `/download-file/${fileId}?sessionId=${sessionId}`
    });
  });

  // Handle shared audio playback
  socket.on('play-audio', ({ sessionId: audioSessionId, audioKey, username }) => {
    console.log(`[${new Date().toISOString()}] Audio playback request: "${audioKey}" by ${username} in session ${audioSessionId}`);
    
    if (!audioSessionId || !audioKey || !username) {
      console.warn('Invalid play-audio request: missing required fields');
      return;
    }

    // Broadcast to all other users in the session (not the sender)
    socket.to(audioSessionId).emit('play-audio', {
      audioKey: audioKey,
      username: username
    });
    
    console.log(`[${new Date().toISOString()}] Broadcasted audio "${audioKey}" to other clients in session ${audioSessionId}`);
  });

  // Handle explicit leave session
  socket.on('leave-session', () => {
    // Clear heartbeat interval
    if (socket.heartbeatInterval) {
      clearInterval(socket.heartbeatInterval);
    }
    
    if (sessionId && clientId && activeSessions.has(sessionId)) {
      // Remove client from session
      activeSessions.get(sessionId).delete(clientId);
      
      // If session is empty, remove it
      if (activeSessions.get(sessionId).size === 0) {
        activeSessions.delete(sessionId);
        // Also remove the stored document for this session
        sessionDocuments.delete(sessionId);
        console.log(`Cleaned up document storage for empty session ${sessionId}`);
        
        // Clean up session files
        if (sessionFiles.has(sessionId)) {
          const fileIds = sessionFiles.get(sessionId);
          for (const fileId of fileIds) {
            activeFiles.delete(fileId);
          }
          sessionFiles.delete(sessionId);
          console.log(`Cleaned up ${fileIds.size} files for empty session ${sessionId}`);
        }
      } else {
        // Get current user list with identities
        const currentUsers = Array.from(activeSessions.get(sessionId).values()).map(user => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          schoolNumber: user.schoolNumber
        }));
        
        // Notify remaining clients about user leaving
        io.to(sessionId).emit('user-left', {
          users: currentUsers
        });
        // Update session status for remaining clients
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

// Function to get client list for a session (without cleanup)
function getSessionClients(sessionId) {
  if (!activeSessions.has(sessionId)) return [];
  
  // Simply return list of current client IDs without modifying the session
  // Cleanup is handled separately by the main cleanup interval
  return Array.from(activeSessions.get(sessionId).keys());
}

// Periodically clean up inactive sessions and clients
setInterval(() => {
  const now = Date.now();
  
  // Check each session
  for (const [sessionId, clients] of activeSessions.entries()) {
    let hasActiveClients = false;
    let removedClients = 0;
    
    // Check each client in this session
    for (const [clientId, data] of clients.entries()) {
      const timeSinceLastSeen = now - data.lastSeen;
      if (timeSinceLastSeen < 30000) {
        hasActiveClients = true;
      } else {
        clients.delete(clientId);
        removedClients++;
      }
    }
    
    // If no active clients, remove the session
    if (!hasActiveClients) {
      activeSessions.delete(sessionId);
      // Also remove the stored document for this session
      sessionDocuments.delete(sessionId);
      console.log(`Cleaned up document storage for inactive session ${sessionId}`);
      
      // Clean up session files
      if (sessionFiles.has(sessionId)) {
        const fileIds = sessionFiles.get(sessionId);
        for (const fileId of fileIds) {
          activeFiles.delete(fileId);
        }
        sessionFiles.delete(sessionId);
        console.log(`Cleaned up ${fileIds.size} files for inactive session ${sessionId}`);
      }
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
