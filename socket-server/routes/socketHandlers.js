// Socket handlers for the main server
module.exports = (io, sessionManager, fileManager, imageCache, aiService, database) => {
  
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    let sessionId = null;
    let clientId = null;

    // Helper function to update client activity timestamp
    const updateClientActivity = (targetSessionId = null, targetClientId = null) => {
      const activeSessionId = targetSessionId || sessionId;
      const activeClientId = targetClientId || clientId;
      
      if (activeSessionId && activeClientId) {
        sessionManager.updateClientActivity(activeSessionId, activeClientId);
      }
    };

    // Handle client joining a session
    socket.on('join-session', async ({ sessionId: sid, clientId: cid, userIdentity, schoolAuth }) => {
      // Validate school authentication
      const VALID_SCHOOL_NUMBERS = (process.env.VALID_SCHOOL_NUMBERS || '906484,894362')
        .split(',').map(num => num.trim());
      
      if (!schoolAuth || !VALID_SCHOOL_NUMBERS.includes(schoolAuth)) {
        console.log(`Unauthorized join attempt - invalid school auth: ${schoolAuth}`);
        socket.emit('auth-error', { 
          message: 'Invalid school authentication. Please verify your school registration number.',
          code: 'INVALID_SCHOOL_AUTH'
        });
        return;
      }

      sessionId = sid;
      clientId = cid || socket.id;
      
      console.log(`Client ${clientId} (${userIdentity?.username || 'Anonymous'}) from school ${schoolAuth} joined session ${sessionId}`);
      
      // Create session if it doesn't exist
      sessionManager.createSession(sessionId);
      
      // Resolve identity conflicts
      const { finalUsername, finalAvatar } = sessionManager.resolveIdentityConflicts(sessionId, userIdentity);
      
      // Add client to session
      sessionManager.addClientToSession(sessionId, clientId, {
        id: clientId,
        socketId: socket.id,
        username: finalUsername,
        avatar: finalAvatar,
        schoolNumber: schoolAuth,
        lastSeen: Date.now()
      });
      
      socket.join(sessionId);
      
      // Set up heartbeat
      const heartbeatInterval = setInterval(() => {
        updateClientActivity();
      }, 15000);
      socket.heartbeatInterval = heartbeatInterval;
      
      // Get current user list
      const currentUsers = sessionManager.getSessionUsers(sessionId);
      
      // Notify about user joined
      socket.to(sessionId).emit('user-joined', { users: currentUsers });
      socket.emit('user-joined', { users: currentUsers });
      
      // Send document content
      await sendDocumentContent(sessionId, socket);
      
      // Send current background image if exists
      sendBackgroundImage(sessionId, socket);
      
      // Send cached images
      await imageCache.sendCachedImagesToClient(sessionId, socket);
    });

    // Document content sending helper
    async function sendDocumentContent(sessionId, socket) {
      if (sessionManager.hasSessionDocument(sessionId)) {
        const currentDocument = sessionManager.getSessionDocument(sessionId);
        console.log(`Sending current document to new client ${clientId} in session ${sessionId}`);
        socket.emit('document-update', {
          document: currentDocument,
          updatedBy: 'server',
          timestamp: Date.now(),
          isInitialLoad: true
        });
      } else {
        try {
          const documentContent = await database.loadSession(sessionId);
          if (documentContent) {
            console.log(`Loaded document from database for session ${sessionId}`);
            sessionManager.setSessionDocument(sessionId, documentContent);
            socket.emit('document-update', {
              document: documentContent,
              updatedBy: 'server',
              timestamp: Date.now(),
              isInitialLoad: true
            });
          } else {
            console.log(`No saved document found for session ${sessionId}`);
            socket.emit('document-update', {
              document: '',
              updatedBy: 'server',
              timestamp: Date.now(),
              isInitialLoad: true
            });
          }
        } catch (error) {
          console.error(`Error loading document for session ${sessionId}:`, error);
          socket.emit('document-update', {
            document: '',
            updatedBy: 'server',
            timestamp: Date.now(),
            isInitialLoad: true
          });
        }
      }
    }

    // Background image sending helper
    function sendBackgroundImage(sessionId, socket) {
      if (sessionManager.hasSessionBackgroundImage(sessionId)) {
        const backgroundData = sessionManager.getSessionBackgroundImage(sessionId);
        console.log(`Sending current background image to new client ${clientId} in session ${sessionId}`);
        socket.emit('background-image-update', {
          backgroundImage: backgroundData.backgroundImage,
          filename: backgroundData.filename,
          updatedBy: 'server',
          timestamp: Date.now(),
          isInitialLoad: true
        });
      }
    }

    // Handle WebRTC signaling
    socket.on('signal', ({ target, signal }) => {
      if (!sessionId || !clientId) {
        console.error('Client tried to send signal without joining a session');
        return;
      }

      updateClientActivity();
      console.log(`Signal from ${clientId} to ${target}`);

      if (target === 'all') {
        socket.to(sessionId).emit('signal', { from: clientId, signal });
      } else if (sessionManager.getClientFromSession(sessionId, target)) {
        const targetSocketId = sessionManager.getClientFromSession(sessionId, target).socketId;
        io.to(targetSocketId).emit('signal', { from: clientId, signal });
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
      updateClientActivity();
      socket.emit('client-list', sessionManager.getSessionClients(sessionId));
    });

    // Handle direct messages
    socket.on('direct-message', ({ target, message }) => {
      if (!sessionId || !clientId) {
        console.error('Client tried to send direct message without joining a session');
        return;
      }
      
      updateClientActivity();
      console.log(`Direct message from ${clientId} to ${target}`);
      
      if (target === 'all') {
        socket.to(sessionId).emit('direct-message', { from: clientId, message });
      } else if (sessionManager.getClientFromSession(sessionId, target)) {
        const targetSocketId = sessionManager.getClientFromSession(sessionId, target).socketId;
        io.to(targetSocketId).emit('direct-message', { from: clientId, message });
      } else {
        console.warn(`Target client ${target} not found in session ${sessionId}`);
      }
    });

    // Handle document changes
    socket.on('document-change', ({ sessionId: docSessionId, document }) => {
      if (!docSessionId) {
        console.error('No session ID provided for document change');
        return;
      }
      
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
      updateClientActivity(docSessionId, clientId || socket.id);
      
      sessionManager.setSessionDocument(docSessionId, document);
      sessionManager.debouncedSaveSession(docSessionId, document, database);
      
      socket.to(docSessionId).emit('document-update', {
        document: document,
        updatedBy: socket.id,
        timestamp: Date.now()
      });
    });

    // Handle background image changes
    socket.on('background-image-change', ({ sessionId: bgSessionId, backgroundImage, filename }) => {
      if (!bgSessionId) {
        console.error('No session ID provided for background image change');
        return;
      }
      
      console.log(`Background image updated in session ${bgSessionId} by ${socket.id}`);
      updateClientActivity(bgSessionId, clientId || socket.id);
      
      // Store the background image in the session (optional - for persistence)
      if (sessionManager.hasSession(bgSessionId)) {
        sessionManager.setSessionBackgroundImage(bgSessionId, backgroundImage, filename);
      }
      
      // Broadcast to all other clients in the session
      socket.to(bgSessionId).emit('background-image-update', {
        backgroundImage: backgroundImage,
        filename: filename,
        updatedBy: socket.id,
        timestamp: Date.now()
      });
    });

    // Handle AI requests
    socket.on('ask-ai', async ({ sessionId: aiSessionId, selectedText }) => {
      if (!aiSessionId || !selectedText || selectedText.trim() === '') {
        console.error('Invalid AI request parameters');
        return;
      }
      
      updateClientActivity(aiSessionId, clientId || socket.id);
      await aiService.processAIRequest(selectedText, aiSessionId, sessionManager, socket, io);
    });

    socket.on('ask-ai-direct', async ({ sessionId: aiSessionId, selectedText, requestId }) => {
      if (!aiSessionId || !selectedText || selectedText.trim() === '') {
        console.error('Invalid direct AI request parameters');
        return;
      }
      
      updateClientActivity(aiSessionId, clientId || socket.id);
      await aiService.processDirectAIRequest(selectedText, requestId, socket);
    });

    // File sharing handlers
    socket.on('file-share-request', ({ filename, size, mimeType, sessionId: requestSessionId }) => {
      const activeSessionId = requestSessionId || sessionId;
      const activeClientId = clientId || socket.id;
      
      if (!activeSessionId || !activeClientId) {
        socket.emit('file-share-error', { message: 'Must be in a session to share files' });
        return;
      }
      
      updateClientActivity();
      
      if (!sessionManager.hasSession(activeSessionId)) {
        socket.emit('file-share-error', { message: 'Session not found or inactive' });
        return;
      }
      
      const validation = fileManager.validateFileType(filename, mimeType);
      if (!validation.valid) {
        socket.emit('file-share-error', { message: validation.reason });
        return;
      }
      
      if (size > fileManager.FILE_CONFIG.maxFileSize) {
        socket.emit('file-share-error', { 
          message: `File too large. Maximum size is ${fileManager.FILE_CONFIG.maxFileSize / 1024 / 1024}MB` 
        });
        return;
      }
      
      if (!fileManager.checkUploadRateLimit(activeClientId)) {
        socket.emit('file-share-error', { 
          message: `Upload limit exceeded. Maximum ${fileManager.FILE_CONFIG.maxUploadsPerUser} uploads per ${fileManager.FILE_CONFIG.uploadWindowMinutes} minutes.` 
        });
        return;
      }
      
      const fileId = fileManager.generateFileId();
      
      const fileTransferData = {
        id: fileId,
        filename: filename,
        mimeType: mimeType,
        size: size,
        sessionId: activeSessionId,
        uploadedBy: activeClientId,
        uploadTimestamp: Date.now(),
        chunks: new Map(),
        totalChunks: Math.ceil(size / fileManager.FILE_CONFIG.chunkSize),
        receivedChunks: 0,
        buffer: null,
        isComplete: false
      };
      
      fileManager.activeFiles.set(fileId, fileTransferData);
      
      console.log(`File share initiated: ${filename} (${size} bytes) by ${activeClientId} in session ${activeSessionId}`);
      
      socket.emit('file-share-accepted', { 
        fileId: fileId,
        chunkSize: fileManager.FILE_CONFIG.chunkSize
      });
    });

    socket.on('file-chunk', ({ fileId, chunkIndex, chunkData, isLastChunk }) => {
      const fileTransfer = fileManager.getFile(fileId);
      if (!fileTransfer) {
        socket.emit('file-share-error', { message: 'File transfer not found or expired' });
        return;
      }
      
      if (fileTransfer.sessionId !== sessionId || fileTransfer.uploadedBy !== clientId) {
        socket.emit('file-share-error', { message: 'Invalid file transfer session' });
        return;
      }
      
      const chunkBuffer = Buffer.from(chunkData, 'base64');
      fileTransfer.chunks.set(chunkIndex, chunkBuffer);
      fileTransfer.receivedChunks++;
      
      console.log(`Received chunk ${chunkIndex + 1}/${fileTransfer.totalChunks} for file ${fileTransfer.filename}`);
      
      socket.emit('file-upload-progress', {
        fileId: fileId,
        progress: (fileTransfer.receivedChunks / fileTransfer.totalChunks) * 100,
        receivedChunks: fileTransfer.receivedChunks,
        totalChunks: fileTransfer.totalChunks
      });
      
      // Check if all chunks received
      if (fileTransfer.receivedChunks === fileTransfer.totalChunks || isLastChunk) {
        handleFileUploadComplete(fileTransfer, socket);
      }
    });

    async function handleFileUploadComplete(fileTransfer, socket) {
      const sortedChunks = [];
      for (let i = 0; i < fileTransfer.totalChunks; i++) {
        if (fileTransfer.chunks.has(i)) {
          sortedChunks.push(fileTransfer.chunks.get(i));
        }
      }
      
      if (sortedChunks.length === fileTransfer.totalChunks) {
        fileTransfer.buffer = Buffer.concat(sortedChunks);
        fileTransfer.isComplete = true;
        fileTransfer.chunks.clear();
        
        fileManager.addUploadToRateLimit(clientId);
        fileManager.storeFile(fileTransfer);
        
        console.log(`File upload completed: ${fileTransfer.filename} by ${clientId}`);
        
        socket.emit('file-upload-complete', {
          fileId: fileTransfer.id,
          filename: fileTransfer.filename,
          size: fileTransfer.size
        });
        
        const uploaderInfo = sessionManager.getClientFromSession(sessionId, clientId);
        const uploaderUsername = uploaderInfo?.username || 'Anonymous User';

        io.to(sessionId).emit('file-available', {
          fileId: fileTransfer.id,
          filename: fileTransfer.filename,
          size: fileTransfer.size,
          mimeType: fileTransfer.mimeType,
          uploadedBy: clientId,
          uploaderUsername: uploaderUsername,
          timestamp: Date.now()
        });

        // Cache image if it's an image file
        console.log(`Checking if file should be cached - MIME type: ${fileTransfer.mimeType}, isImage: ${imageCache.isImageFile(fileTransfer.mimeType)}`);
        if (imageCache.isImageFile(fileTransfer.mimeType)) {
          console.log(`Attempting to cache image: ${fileTransfer.filename}`);
          const fileDataForCaching = {
            id: fileTransfer.id,
            filename: fileTransfer.filename,
            mimeType: fileTransfer.mimeType,
            size: fileTransfer.size,
            buffer: fileTransfer.buffer,
            uploadTimestamp: fileTransfer.uploadTimestamp,
            uploadedBy: clientId
          };
          imageCache.cacheImageForSession(sessionId, fileDataForCaching, uploaderUsername).catch(err => {
            console.error('Error caching image:', err);
          });
        } else {
          console.log(`File ${fileTransfer.filename} not cached (not an image or unsupported type)`);
        }
      } else {
        socket.emit('file-share-error', { message: 'File assembly failed - missing chunks' });
      }
    }

    // Handle audio playback
    socket.on('play-audio', ({ sessionId: audioSessionId, audioKey, username }) => {
      console.log(`[${new Date().toISOString()}] Audio playback request: "${audioKey}" by ${username} in session ${audioSessionId}`);
      
      if (!audioSessionId || !audioKey || !username) {
        console.warn('Invalid play-audio request: missing required fields');
        return;
      }

      socket.to(audioSessionId).emit('play-audio', {
        audioKey: audioKey,
        username: username
      });
      
      console.log(`[${new Date().toISOString()}] Broadcasted audio "${audioKey}" to other clients in session ${audioSessionId}`);
    });

    // Drawing game words list
    const DRAWING_WORDS = [
      'cat', 'dog', 'house', 'tree', 'car', 'flower', 'bird', 'fish', 'sun', 'moon',
      'star', 'cloud', 'mountain', 'river', 'book', 'phone', 'computer', 'pizza', 'cake', 'apple',
      'banana', 'guitar', 'piano', 'bicycle', 'airplane', 'boat', 'train', 'butterfly', 'elephant', 'lion',
      'penguin', 'rainbow', 'snowman', 'castle', 'bridge', 'clock', 'heart', 'diamond', 'arrow', 'crown',
      'key', 'door', 'window', 'chair', 'table', 'lamp', 'mirror', 'camera', 'balloon', 'umbrella'
    ];

    // Handle game start
    socket.on('start-game', ({ sessionId: gameSessionId, starter }) => {
      console.log(`[${new Date().toISOString()}] Game start request by ${starter} in session ${gameSessionId}`);
      
      if (!gameSessionId || !starter) {
        console.warn('Invalid start-game request: missing required fields');
        return;
      }

      // Get random word
      const randomWord = DRAWING_WORDS[Math.floor(Math.random() * DRAWING_WORDS.length)];
      
      // Set game timer
      const gameTimeLimit = 90; // 90 seconds
      
      // Start the game
      io.to(gameSessionId).emit('game-started', {
        drawer: starter,
        word: randomWord,
        timeLeft: gameTimeLimit
      });
      
      // Start game timer
      let timeLeft = gameTimeLimit;
      const gameTimer = setInterval(() => {
        timeLeft--;
        
        // Send timer update
        io.to(gameSessionId).emit('game-timer-update', { timeLeft });
        
        // End game when time runs out
        if (timeLeft <= 0) {
          clearInterval(gameTimer);
          io.to(gameSessionId).emit('game-ended', { winner: null });
        }
      }, 1000);
      
      // Store timer reference (you might want to add this to sessionManager)
      if (!global.gameTimers) global.gameTimers = {};
      global.gameTimers[gameSessionId] = gameTimer;
      
      console.log(`[${new Date().toISOString()}] Game started in session ${gameSessionId}: ${starter} drawing "${randomWord}"`);
    });

    // Handle game guess
    socket.on('game-guess', ({ sessionId: gameSessionId, guess, username }) => {
      console.log(`[${new Date().toISOString()}] Game guess by ${username} in session ${gameSessionId}: "${guess}"`);
      
      if (!gameSessionId || !guess || !username) {
        console.warn('Invalid game-guess request: missing required fields');
        return;
      }

      // Broadcast guess to all players
      io.to(gameSessionId).emit('game-guess', {
        username,
        guess,
        timestamp: Date.now()
      });

      // You would need to track the current word and check for correct answers
      // For now, we'll implement a simple check (this should be enhanced)
      // The word would need to be stored in sessionManager for proper game state
      console.log(`[${new Date().toISOString()}] Broadcasted guess "${guess}" by ${username} to session ${gameSessionId}`);
    });

    // Handle drawing updates
    socket.on('drawing-update', ({ sessionId: gameSessionId, drawingData }) => {
      console.log(`🎨 [SERVER] Drawing update received for session ${gameSessionId}:`, {
        type: drawingData?.type,
        pathsCount: drawingData?.paths?.length,
        clear: drawingData?.clear,
        from: drawingData?.from,
        to: drawingData?.to,
        timestamp: Date.now()
      });
      
      if (!gameSessionId || !drawingData) {
        console.warn('🎨 [SERVER] Invalid drawing-update request: missing required fields');
        return;
      }

      // Log the drawing data structure based on type
      if (drawingData.type === 'draw_line') {
        console.log(`🎨 [SERVER] Line drawing from (${drawingData.from?.x}, ${drawingData.from?.y}) to (${drawingData.to?.x}, ${drawingData.to?.y})`);
      } else if (drawingData.type === 'clear') {
        console.log(`🎨 [SERVER] Canvas clear request`);
      } else if (drawingData.type === 'full_sync') {
        console.log(`🎨 [SERVER] Full sync with ${drawingData.paths?.length} paths`);
      } else if (drawingData.paths) {
        console.log(`🎨 [SERVER] Legacy paths data:`, drawingData.paths.map((path, i) => `Path ${i}: ${path.length} points`));
      }

      // Broadcast drawing update to all other players (not the drawer)
      console.log(`🎨 [SERVER] Broadcasting drawing update to session ${gameSessionId}`);
      socket.to(gameSessionId).emit('drawing-update', {
        drawingData,
        timestamp: Date.now()
      });
      
      console.log(`🎨 [SERVER] Drawing update broadcasted successfully`);
    });

    // Handle game end (manual)
    socket.on('end-game', ({ sessionId: gameSessionId }) => {
      console.log(`[${new Date().toISOString()}] Manual game end request for session ${gameSessionId}`);
      
      if (!gameSessionId) {
        console.warn('Invalid end-game request: missing sessionId');
        return;
      }

      // Clear any active game timer
      if (global.gameTimers && global.gameTimers[gameSessionId]) {
        clearInterval(global.gameTimers[gameSessionId]);
        delete global.gameTimers[gameSessionId];
      }

      // End the game
      io.to(gameSessionId).emit('game-ended', { winner: null });
      
      console.log(`[${new Date().toISOString()}] Game ended manually in session ${gameSessionId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
      }
      
      if (sessionId && clientId) {
        const shouldCleanupSession = sessionManager.removeClientFromSession(sessionId, clientId);
        
        if (shouldCleanupSession) {
          // Save document before cleanup
          const documentContent = sessionManager.getSessionDocument(sessionId);
          if (documentContent && documentContent.trim().length > 0) {
            database.saveSession(sessionId, documentContent)
              .then(() => {
                console.log(`Document saved to database for session ${sessionId} before cleanup`);
              })
              .catch((error) => {
                console.error(`Failed to save document for session ${sessionId}:`, error);
              });
          }
          
          sessionManager.deleteSession(sessionId);
          fileManager.cleanupSessionFiles(sessionId);
          console.log(`Cleaned up memory storage for empty session ${sessionId}`);
        } else {
          // Notify remaining clients
          const currentUsers = sessionManager.getSessionUsers(sessionId);
          io.to(sessionId).emit('user-left', { users: currentUsers });
        }
      }
    });

    // Handle explicit leave session
    socket.on('leave-session', () => {
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
      }
      
      if (sessionId && clientId) {
        const shouldCleanupSession = sessionManager.removeClientFromSession(sessionId, clientId);
        
        if (shouldCleanupSession) {
          sessionManager.deleteSession(sessionId);
          fileManager.cleanupSessionFiles(sessionId);
          console.log(`Cleaned up document storage for empty session ${sessionId}`);
        } else {
          const currentUsers = sessionManager.getSessionUsers(sessionId);
          io.to(sessionId).emit('user-left', { users: currentUsers });
        }
      }
      
      sessionId = null;
      clientId = null;
    });
  });
};