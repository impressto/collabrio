const crypto = require('crypto');
const path = require('path');

// File sharing configuration
const getFileConfig = () => ({
  maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024, // Default: 100MB
  timeoutMinutes: parseInt(process.env.FILE_TIMEOUT_MINUTES) || 5,
  chunkSize: 64 * 1024, // 64KB (fixed for protocol compatibility)
  maxUploadsPerUser: parseInt(process.env.MAX_UPLOADS_PER_USER) || 3,
  uploadWindowMinutes: parseInt(process.env.UPLOAD_WINDOW_MINUTES) || 5,
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
});

class FileManager {
  constructor() {
    this.FILE_CONFIG = getFileConfig();
    this.activeFiles = new Map(); // Store active file transfers (fileId -> file metadata and chunks)
    this.sessionFiles = new Map(); // Store session file uploads tracking (sessionId -> Set of fileIds)
    this.uploadRateLimits = new Map(); // Rate limiting for file uploads (userId -> upload timestamps)
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  // File sharing helper functions
  generateFileId() {
    return crypto.randomBytes(16).toString('hex');
  }

  validateFileType(filename, mimeType) {
    const ext = path.extname(filename).toLowerCase();
    
    // Check blocked extensions
    if (this.FILE_CONFIG.blockedExtensions.includes(ext)) {
      return { valid: false, reason: `File type ${ext} is not allowed` };
    }
    
    // Check allowed MIME types
    if (!this.FILE_CONFIG.allowedTypes.includes(mimeType)) {
      return { valid: false, reason: `MIME type ${mimeType} is not allowed` };
    }
    
    return { valid: true };
  }

  checkUploadRateLimit(userId) {
    const now = Date.now();
    const windowStart = now - (this.FILE_CONFIG.uploadWindowMinutes * 60 * 1000);
    
    if (!this.uploadRateLimits.has(userId)) {
      this.uploadRateLimits.set(userId, []);
    }
    
    const userUploads = this.uploadRateLimits.get(userId);
    
    // Remove old uploads outside the window
    const recentUploads = userUploads.filter(timestamp => timestamp > windowStart);
    this.uploadRateLimits.set(userId, recentUploads);
    
    return recentUploads.length < this.FILE_CONFIG.maxUploadsPerUser;
  }

  addUploadToRateLimit(userId) {
    const now = Date.now();
    if (!this.uploadRateLimits.has(userId)) {
      this.uploadRateLimits.set(userId, []);
    }
    this.uploadRateLimits.get(userId).push(now);
  }

  // File storage and retrieval
  storeFile(fileData) {
    this.activeFiles.set(fileData.id, fileData);
    
    // Track file for session
    if (!this.sessionFiles.has(fileData.sessionId)) {
      this.sessionFiles.set(fileData.sessionId, new Set());
    }
    this.sessionFiles.get(fileData.sessionId).add(fileData.id);
  }

  getFile(fileId) {
    return this.activeFiles.get(fileId);
  }

  deleteFile(fileId) {
    const fileData = this.activeFiles.get(fileId);
    if (fileData) {
      this.activeFiles.delete(fileId);
      
      // Remove from session tracking
      if (this.sessionFiles.has(fileData.sessionId)) {
        this.sessionFiles.get(fileData.sessionId).delete(fileId);
      }
    }
  }

  // Cleanup expired files
  cleanupExpiredFiles(io) {
    const now = Date.now();
    const expiredFiles = [];
    
    for (const [fileId, fileData] of this.activeFiles.entries()) {
      if (now - fileData.uploadTimestamp > this.FILE_CONFIG.timeoutMinutes * 60 * 1000) {
        expiredFiles.push(fileId);
      }
    }
    
    for (const fileId of expiredFiles) {
      console.log(`Cleaning up expired file: ${fileId}`);
      const fileData = this.activeFiles.get(fileId);
      this.deleteFile(fileId);
      
      // Notify session participants that file expired
      if (fileData && fileData.sessionId) {
        io.to(fileData.sessionId).emit('file-expired', { fileId });
      }
    }
  }

  // Cleanup files for empty sessions
  cleanupSessionFiles(sessionId) {
    if (this.sessionFiles.has(sessionId)) {
      const fileIds = this.sessionFiles.get(sessionId);
      for (const fileId of fileIds) {
        this.activeFiles.delete(fileId);
      }
      this.sessionFiles.delete(sessionId);
      console.log(`Cleaned up ${fileIds.size} files for empty session ${sessionId}`);
    }
  }

  // Start cleanup interval
  startCleanupInterval() {
    // Run cleanup every minute
    setInterval(() => {
      // Note: io will be passed when this is called from the main server
      // For now, we'll handle this in the main server file
    }, 60 * 1000);
  }

  // Get configuration for client
  getConfig() {
    return {
      maxFileSize: this.FILE_CONFIG.maxFileSize,
      maxFileSizeMB: this.FILE_CONFIG.maxFileSize / (1024 * 1024),
      fileTimeout: this.FILE_CONFIG.timeoutMinutes * 60 * 1000, // Convert to milliseconds
      maxUploadsPerUser: this.FILE_CONFIG.maxUploadsPerUser,
      uploadWindow: this.FILE_CONFIG.uploadWindowMinutes * 60 * 1000 // Convert to milliseconds
    };
  }

  // Get active files count
  getActiveFilesCount() {
    return this.activeFiles.size;
  }
}

module.exports = FileManager;