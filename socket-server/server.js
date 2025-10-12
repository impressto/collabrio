require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Import our modular components
const Database = require('./config/database');
const SessionManager = require('./modules/sessionManager');
const FileManager = require('./modules/fileManager');
const ImageCache = require('./modules/imageCache');
const AIService = require('./modules/aiService');
const FileWatcher = require('./modules/fileWatcher');

// Initialize components
const database = new Database();
const sessionManager = new SessionManager();
const fileManager = new FileManager();
const imageCache = new ImageCache(database);
const aiService = new AIService();

// Get valid school registration numbers from environment
const getValidSchoolNumbers = () => {
  const envNumbers = process.env.VALID_SCHOOL_NUMBERS || '906484,894362';
  return envNumbers.split(',').map(num => num.trim());
};

const VALID_SCHOOL_NUMBERS = getValidSchoolNumbers();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: fileManager.FILE_CONFIG.maxFileSize,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const validation = fileManager.validateFileType(file.originalname, file.mimetype);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.reason));
    }
  }
});

// Serve admin interface
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// School validation endpoint
app.post('/validate-school', (req, res) => {
  const { schoolNumber } = req.body;
  
  if (!schoolNumber) {
    return res.status(400).json({ valid: false, error: 'School number required' });
  }
  
  if (!/^\d{6}$/.test(schoolNumber)) {
    return res.status(400).json({ valid: false, error: 'Invalid format' });
  }
  
  const isValid = VALID_SCHOOL_NUMBERS.includes(schoolNumber);
  console.log(`School validation attempt: ${schoolNumber} - ${isValid ? 'VALID' : 'INVALID'}`);
  
  res.json({ 
    valid: isValid,
    message: isValid ? 'School registration valid' : 'Invalid school registration number'
  });
});

// File upload endpoint
app.post('/upload-file', upload.single('file'), (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    if (!sessionId || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'sessionId and userId are required'
      });
    }
    
    if (!sessionManager.hasSession(sessionId)) {
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
    
    if (!fileManager.checkUploadRateLimit(userId)) {
      return res.status(429).json({
        status: 'error',
        message: `Upload limit exceeded. Maximum ${fileManager.FILE_CONFIG.maxUploadsPerUser} uploads per ${fileManager.FILE_CONFIG.uploadWindowMinutes} minutes.`
      });
    }
    
    const fileId = fileManager.generateFileId();
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
    
    fileManager.storeFile(fileData);
    fileManager.addUploadToRateLimit(userId);
    
    console.log(`File uploaded: ${req.file.originalname} (${req.file.size} bytes) by ${userId} in session ${sessionId}`);
    
    const uploaderInfo = sessionManager.getClientFromSession(sessionId, userId);
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

    // Cache image if it's an image file
    console.log(`Checking if file should be cached - MIME type: ${req.file.mimetype}, isImage: ${imageCache.isImageFile(req.file.mimetype)}`);
    if (imageCache.isImageFile(req.file.mimetype)) {
      console.log(`Attempting to cache image: ${req.file.originalname}`);
      imageCache.cacheImageForSession(sessionId, fileData, uploaderUsername).catch(err => {
        console.error('Error caching image:', err);
      });
    } else {
      console.log(`File ${req.file.originalname} not cached (not an image or unsupported type)`);
    }
    
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

// File download endpoint
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
    
    if (!sessionManager.hasSession(sessionId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found or inactive'
      });
    }
    
    const fileData = fileManager.getFile(fileId);
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
    
    fileData.downloadCount++;
    console.log(`File downloaded: ${fileData.filename} (download #${fileData.downloadCount}) from session ${sessionId}`);
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Length', fileData.size);
    res.send(fileData.buffer);
    
    // Notify session participants about download
    io.to(sessionId).emit('file-downloaded', {
      fileId: fileId,
      filename: fileData.filename,
      downloadCount: fileData.downloadCount,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      status: 'error',
      message: 'File download failed'
    });
  }
});

// Cached image serving endpoint
app.get('/cached-image/:sessionId/:fileId', async (req, res) => {
  try {
    const { sessionId, fileId } = req.params;
    const result = await imageCache.serveCachedImage(sessionId, fileId);
    
    if (result.error) {
      return res.status(result.status || 500).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Length', result.fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(result.buffer);
    
  } catch (error) {
    console.error('Cached image serving error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error serving cached image'
    });
  }
});

// Delete cached image endpoint
app.delete('/cached-image/:sessionId/:fileId', async (req, res) => {
  try {
    const { sessionId, fileId } = req.params;
    
    // Check if session exists
    if (!sessionManager.hasSession(sessionId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found or inactive'
      });
    }
    
    const result = await imageCache.deleteCachedImage(sessionId, fileId);
    
    if (result.error) {
      return res.status(result.status || 500).json({
        status: 'error',
        message: result.error
      });
    }
    
    console.log(`Cached image deleted via API: ${result.filename} from session ${sessionId}`);
    
    // Notify all clients in the session about the deletion
    io.to(sessionId).emit('cached-image-deleted', {
      sessionId,
      fileId,
      filename: result.filename,
      timestamp: Date.now()
    });
    
    res.json({
      status: 'success',
      message: 'Cached image deleted successfully',
      filename: result.filename
    });
    
  } catch (error) {
    console.error('Cached image deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting cached image'
    });
  }
});

// Configuration endpoint
app.get('/config', (req, res) => {
  res.json(fileManager.getConfig());
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'WebRTC Socket server is running',
    activeSessions: sessionManager.getAllSessionIds(),
    activeFiles: fileManager.getActiveFilesCount()
  });
});

// Text injection endpoint
app.post('/inject-text', (req, res) => {
  const { sessionId, text, type = 'system' } = req.body;
  
  if (!sessionId || !text) {
    return res.status(400).json({
      status: 'error',
      message: 'sessionId and text are required'
    });
  }
  
  if (!sessionManager.hasSession(sessionId)) {
    return res.status(404).json({
      status: 'error',
      message: `Session ${sessionId} not found or has no active clients`
    });
  }
  
  console.log(`Injecting text into session ${sessionId}: "${text}"`);
  
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
    clientsNotified: sessionManager.getSession(sessionId).size
  });
});

// Debug endpoint
app.get('/debug/sessions', (req, res) => {
  res.json(sessionManager.getSessionStats());
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize file watcher
const fileWatcher = new FileWatcher(io);
fileWatcher.setSessionManager(sessionManager);

// Socket.IO connection handling
require('./routes/socketHandlers')(io, sessionManager, fileManager, imageCache, aiService, database);

// Cleanup intervals
setInterval(() => {
  fileManager.cleanupExpiredFiles(io);
}, 60 * 1000);

setInterval(() => {
  const sessionsToCleanup = sessionManager.cleanupInactiveClients();
  sessionsToCleanup.forEach(sessionId => {
    console.log(`Cleaned up document storage for inactive session ${sessionId}`);
    fileManager.cleanupSessionFiles(sessionId);
    sessionManager.deleteSession(sessionId);
  });
}, 10000);

setInterval(() => {
  database.cleanupOldSessions();
  imageCache.cleanupInactiveCachedImages();
}, 24 * 60 * 60 * 1000);

// Start cleanup on startup
database.cleanupOldSessions();
imageCache.cleanupInactiveCachedImages();

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io, sessionManager, fileManager, imageCache, aiService, database };