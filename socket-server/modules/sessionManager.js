class SessionManager {
  constructor() {
    this.activeSessions = new Map(); // Store active sessions
    this.sessionDocuments = new Map(); // Store session documents (sessionId -> document content)
    this.sessionBackgroundImages = new Map(); // Store session background images (sessionId -> {backgroundImage, filename})
    this.saveTimeouts = new Map(); // Debouncing for document saves (sessionId -> timeout)
  }

  // Session management
  createSession(sessionId) {
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, new Map());
    }
    return this.activeSessions.get(sessionId);
  }

  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  hasSession(sessionId) {
    return this.activeSessions.has(sessionId);
  }

  deleteSession(sessionId) {
    this.activeSessions.delete(sessionId);
    this.sessionDocuments.delete(sessionId);
    this.sessionBackgroundImages.delete(sessionId);
    
    // Clear any pending save timeout
    if (this.saveTimeouts.has(sessionId)) {
      clearTimeout(this.saveTimeouts.get(sessionId));
      this.saveTimeouts.delete(sessionId);
    }
  }

  // Client management within sessions
  addClientToSession(sessionId, clientId, clientData) {
    const session = this.createSession(sessionId);
    session.set(clientId, clientData);
  }

  removeClientFromSession(sessionId, clientId) {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.get(sessionId).delete(clientId);
      
      // If session is empty, clean it up
      if (this.activeSessions.get(sessionId).size === 0) {
        return true; // Indicates session should be cleaned up
      }
    }
    return false;
  }

  getClientFromSession(sessionId, clientId) {
    const session = this.getSession(sessionId);
    return session ? session.get(clientId) : null;
  }

  // Document management
  setSessionDocument(sessionId, document) {
    this.sessionDocuments.set(sessionId, document);
  }

  getSessionDocument(sessionId) {
    return this.sessionDocuments.get(sessionId);
  }

  hasSessionDocument(sessionId) {
    return this.sessionDocuments.has(sessionId);
  }

  // Background image management
  setSessionBackgroundImage(sessionId, backgroundImage, filename) {
    this.sessionBackgroundImages.set(sessionId, { backgroundImage, filename });
  }

  getSessionBackgroundImage(sessionId) {
    return this.sessionBackgroundImages.get(sessionId);
  }

  hasSessionBackgroundImage(sessionId) {
    return this.sessionBackgroundImages.has(sessionId);
  }

  // Debounced document saving
  debouncedSaveSession(sessionId, documentContent, database, delay = 5000) {
    // Clear existing timeout for this session
    if (this.saveTimeouts.has(sessionId)) {
      clearTimeout(this.saveTimeouts.get(sessionId));
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      if (documentContent && documentContent.trim().length > 0) {
        database.saveSession(sessionId, documentContent)
          .then(() => {
            console.log(`Document auto-saved to database for session ${sessionId}`);
          })
          .catch((error) => {
            console.error(`Failed to auto-save document for session ${sessionId}:`, error);
          });
      }
      this.saveTimeouts.delete(sessionId);
    }, delay);
    
    this.saveTimeouts.set(sessionId, timeout);
  }

  // Identity conflict resolution
  resolveIdentityConflicts(sessionId, userIdentity) {
    const sessionUsers = Array.from(this.getSession(sessionId).values());
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
    
    return { finalUsername, finalAvatar };
  }

  // Get session statistics
  getSessionStats() {
    const stats = {
      totalSessions: this.activeSessions.size,
      sessionsWithDocuments: this.sessionDocuments.size,
      sessions: {}
    };

    for (const [sessionId, clients] of this.activeSessions.entries()) {
      stats.sessions[sessionId] = {
        clientCount: clients.size,
        clients: Array.from(clients.keys()),
        hasDocument: this.sessionDocuments.has(sessionId)
      };
    }

    return stats;
  }

  // Get user list for a session
  getSessionUsers(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return [];

    return Array.from(session.values()).map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      schoolNumber: user.schoolNumber,
      lastSeen: user.lastSeen
    }));
  }

  // Update client activity
  updateClientActivity(sessionId, clientId) {
    const client = this.getClientFromSession(sessionId, clientId);
    if (client) {
      client.lastSeen = Date.now();
    }
  }

  // Clean up inactive clients
  cleanupInactiveClients(timeoutMs = 30000) {
    const now = Date.now();
    const sessionsToCleanup = [];

    for (const [sessionId, clients] of this.activeSessions.entries()) {
      let hasActiveClients = false;
      let removedClients = 0;
      
      // Check each client in this session
      for (const [clientId, data] of clients.entries()) {
        const timeSinceLastSeen = now - data.lastSeen;
        if (timeSinceLastSeen < timeoutMs) {
          hasActiveClients = true;
        } else {
          clients.delete(clientId);
          removedClients++;
        }
      }
      
      // If no active clients, mark session for cleanup
      if (!hasActiveClients) {
        sessionsToCleanup.push(sessionId);
      }
    }

    return sessionsToCleanup;
  }

  // Get client list for a session (for backwards compatibility)
  getSessionClients(sessionId) {
    if (!this.activeSessions.has(sessionId)) return [];
    return Array.from(this.activeSessions.get(sessionId).keys());
  }

  // Get all session IDs
  getAllSessionIds() {
    return Array.from(this.activeSessions.keys());
  }
}

module.exports = SessionManager;