const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class FileWatcher {
  constructor(io) {
    this.io = io;
    this.messageDir = path.join(__dirname, '..', 'messages');
    this.initialize();
  }

  initialize() {
    // Ensure message directory exists
    if (!fs.existsSync(this.messageDir)) {
      fs.mkdirSync(this.messageDir, { recursive: true });
      console.log(`Created message directory: ${this.messageDir}`);
    }
    
    this.setupWatcher();
  }

  setupWatcher() {
    console.log(`Watching for message files in: ${this.messageDir}`);
    console.log('File naming patterns:');
    console.log('  - <sessionId>.txt (default type: system)');
    console.log('  - <sessionId>_<type>.txt (e.g., abc123_bot.txt)');
    
    const watcher = chokidar.watch(this.messageDir, {
      ignored: /^\./, // ignore dotfiles
      persistent: true,
      ignoreInitial: true // don't trigger on existing files during startup
    });

    watcher.on('add', (filePath) => this.handleMessageFile(filePath));
    watcher.on('change', (filePath) => this.handleMessageFile(filePath));
    
    watcher.on('error', error => {
      console.error('File watcher error:', error);
    });
  }

  handleMessageFile(filePath) {
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
      // Note: This will need to be updated to work with the new SessionManager
      // For now, we'll emit to all sessions and let the client handle it
      
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
      this.io.to(sessionId).emit('server-text-injection', {
        text: messageText,
        type: messageType,
        timestamp: Date.now(),
        injectedBy: 'file-watcher',
        source: fileName
      });
      
      // Move processed file to processed directory
      this.moveProcessedFile(filePath, fileName);
      
    } catch (error) {
      console.error(`Error processing message file ${fileName}:`, error);
    }
  }

  moveProcessedFile(filePath, fileName) {
    try {
      const processedDir = path.join(this.messageDir, 'processed');
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const processedFileName = `${timestamp}_${fileName}`;
      const processedPath = path.join(processedDir, processedFileName);
      
      fs.renameSync(filePath, processedPath);
      console.log(`File processed and moved to: ${processedFileName}`);
    } catch (error) {
      console.error(`Error moving processed file ${fileName}:`, error);
    }
  }

  // Method to check if session exists (to be called with SessionManager)
  setSessionManager(sessionManager) {
    this.sessionManager = sessionManager;
  }

  isSessionActive(sessionId) {
    return this.sessionManager ? this.sessionManager.hasSession(sessionId) : false;
  }
}

module.exports = FileWatcher;