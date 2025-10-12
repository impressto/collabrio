const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.initialize();
  }

  initialize() {
    const dbPath = path.join(__dirname, '..', 'sessions.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database for session persistence');
        this.createTables();
      }
    });
  }

  createTables() {
    // Create sessions table
    this.db.run(`
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

    // Create cached_images table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cached_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        file_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        uploaded_by TEXT NOT NULL,
        uploader_username TEXT NOT NULL,
        upload_timestamp INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating cached_images table:', err.message);
      } else {
        console.log('Cached images table ready');
      }
    });
  }

  // Session database operations
  saveSession(sessionId, documentContent) {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      this.db.run(
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

  loadSession(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.get(
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

  cleanupOldSessions() {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    this.db.run(
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

  // Cached images operations
  insertCachedImage(sessionId, fileId, filename, mimeType, fileSize, uploadedBy, uploaderUsername, uploadTimestamp, filePath) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO cached_images (
          session_id, file_id, filename, mime_type, file_size, 
          uploaded_by, uploader_username, upload_timestamp, file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionId, fileId, filename, mimeType, 
        fileSize, uploadedBy, uploaderUsername, 
        uploadTimestamp, filePath
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  getCachedImages(sessionId, limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT file_id, filename, mime_type, file_size, uploaded_by, 
               uploader_username, upload_timestamp, file_path
        FROM cached_images 
        WHERE session_id = ? 
        ORDER BY upload_timestamp DESC
        LIMIT ?
      `, [sessionId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getAllCachedImagesForSession(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM cached_images 
        WHERE session_id = ? 
        ORDER BY upload_timestamp DESC
      `, [sessionId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  deleteCachedImage(imageId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM cached_images WHERE id = ?', [imageId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getCachedImageInfo(sessionId, fileId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT file_path, filename, mime_type, file_size 
        FROM cached_images 
        WHERE session_id = ? AND file_id = ?
      `, [sessionId, fileId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getInactiveCachedImages(inactiveThreshold) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT ci.*, s.last_updated 
        FROM cached_images ci
        LEFT JOIN sessions s ON ci.session_id = s.id
        WHERE s.last_updated < ? OR s.id IS NULL
      `, [inactiveThreshold], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  deleteCachedImageBySessionAndFileId(sessionId, fileId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM cached_images WHERE session_id = ? AND file_id = ?', 
      [sessionId, fileId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;