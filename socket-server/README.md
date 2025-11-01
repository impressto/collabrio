# Collabrio Server - Modular Architecture

## Overview
The server has been refactored into a modular architecture for better maintainability and separation of concerns. This documentation covers the new structure while maintaining all existing functionality.

## File Structure

```
socket-server/
├── server.js                      # Main server entry point (~350 lines)
├── config/
│   └── database.js                # Database configuration and operations
├── modules/
│   ├── sessionManager.js          # Session and client management
│   ├── fileManager.js             # File upload/download handling
│   ├── imageCache.js              # Image caching system
│   ├── aiService.js               # AI integration (Cohere)
│   └── fileWatcher.js             # File system watching for auto-injection
├── routes/
│   └── socketHandlers.js          # Socket.IO event handlers
└── README.md                      # This file
```

## Module Architecture

### 🗄️ Database (`config/database.js`)
- **Purpose**: SQLite database operations
- **Size**: ~140 lines
- **Responsibilities**:
  - Session persistence (create, read, update, delete)
  - Cached images metadata storage
  - Database table creation and maintenance
  - Cleanup operations for old data
- **Dependencies**: sqlite3, path utilities
- **Key Functions**: `saveSession`, `loadSession`, `saveCachedImage`, `getCachedImages`

### 👥 Session Manager (`modules/sessionManager.js`)
- **Purpose**: Manage active sessions and connected clients
- **Size**: ~200 lines  
- **Responsibilities**:
  - Session lifecycle (create, delete, cleanup)
  - Client management within sessions
  - Identity conflict resolution (username/avatar)
  - Document management per session
  - Activity tracking and timeouts
- **Dependencies**: Pure JavaScript, no external dependencies
- **Key Functions**: `addClientToSession`, `resolveIdentityConflicts`, `debouncedSaveSession`

### 📁 File Manager (`modules/fileManager.js`)
- **Purpose**: Handle file uploads and downloads
- **Size**: ~180 lines
- **Responsibilities**:
  - File validation and type checking
  - Upload rate limiting
  - Temporary file storage in memory
  - File expiration and cleanup
  - Configuration management
- **Dependencies**: crypto, path utilities
- **Key Functions**: `validateFileType`, `checkUploadRateLimit`, `cleanupExpiredFiles`

### 🖼️ Image Cache (`modules/imageCache.js`)
- **Purpose**: Persistent image caching per session
- **Size**: ~220 lines
- **Responsibilities**:
  - Image file detection and validation
  - Disk storage management for images
  - Cache size limits (last 5 images per session)
  - Serving cached images via HTTP endpoints
  - Cleanup of inactive session images
- **Dependencies**: Database module, fs operations
- **Key Functions**: `cacheImageForSession`, `serveCachedImage`, `cleanupInactiveCachedImages`

### 🤖 AI Service (`modules/aiService.js`)
- **Purpose**: AI integration with Cohere API
- **Size**: ~120 lines
- **Responsibilities**:
  - Document-integrated AI responses
  - Direct AI requests (for icebreakers)
  - Error handling and response formatting
  - API interaction management
- **Dependencies**: CohereClientV2
- **Key Functions**: `processAIRequest`, `processDirectAIRequest`

### 👀 File Watcher (`modules/fileWatcher.js`)
- **Purpose**: Monitor file system for auto-injection
- **Size**: ~100 lines
- **Responsibilities**:
  - Watch message directory for new files
  - Parse filename conventions for session targeting
  - Text injection into active sessions
  - File processing and archival
- **Dependencies**: chokidar, path utilities
- **Key Functions**: `handleFileChange`, `processMessageFile`

### 🔌 Socket Handlers (`routes/socketHandlers.js`)
- **Purpose**: Socket.IO event handling and WebRTC signaling
- **Size**: ~300 lines
- **Responsibilities**:
  - WebSocket connection management
  - Real-time collaboration events
  - File sharing via WebSocket
  - AI request handling
  - Session joining and leaving
- **Dependencies**: All modules (sessionManager, fileManager, imageCache, aiService, database)
- **Key Functions**: Event handlers for `join-session`, `file-chunk`, `document-change`, `ask-ai`

### 🚀 Main Server (`server.js`)
- **Purpose**: Application orchestrator and HTTP endpoints
- **Size**: ~350 lines (reduced from 1800+ lines)
- **Responsibilities**:
  - Express server setup and middleware
  - HTTP route definitions
  - Module initialization and coordination
  - Cleanup intervals and maintenance tasks
  - Environment configuration
- **Dependencies**: All created modules
- **Key Functions**: Server initialization, HTTP endpoints, cleanup timers

## Benefits of Modular Architecture

### 🔧 Maintainability
- **Smaller files**: Each module is focused and manageable (100-350 lines vs 1800+ lines)
- **Single responsibility**: Each module has a clear, defined purpose
- **Easier debugging**: Issues are isolated to specific modules
- **Better testing**: Individual modules can be unit tested

### 🚀 Scalability  
- **Independent scaling**: Modules can be optimized independently
- **Feature additions**: New features can be added as new modules
- **Resource management**: Each module manages its own resources

### 👥 Team Development
- **Parallel development**: Different developers can work on different modules
- **Code ownership**: Clear ownership boundaries for each module
- **Reduced conflicts**: Less merge conflicts due to smaller, focused files

### 🔄 Reusability
- **Module reuse**: Modules can potentially be reused in other projects
- **Clear interfaces**: Well-defined APIs between modules
- **Configuration separation**: Environment-specific config isolated

## Migration Notes

### ✅ No Breaking Changes
- **Full backward compatibility**: All APIs and functionality remain unchanged
- **Same endpoints**: All HTTP routes work exactly as before
- **Same socket events**: All WebSocket events maintain compatibility
- **Same configuration**: Environment variables unchanged
- **Same database schema**: No data migration required

### Dependencies Between Modules
Each module explicitly declares its dependencies:
- **Database** ← Base dependency (sqlite3)
- **SessionManager** ← Pure JavaScript (no external deps)
- **FileManager** ← crypto, path utilities  
- **ImageCache** ← Database + fs operations
- **AIService** ← Cohere AI client
- **FileWatcher** ← chokidar + path utilities
- **SocketHandlers** ← All other modules
- **Main Server** ← All modules

## Installation & Setup

Same as before - no changes required:

```bash
npm install
```

Create `.env` file with:
```env
# Server Configuration
PORT=3000
MAX_DOCUMENT_CHARS=20000

# File Upload Configuration  
MAX_FILE_SIZE_MB=100
FILE_TIMEOUT_MINUTES=5
MAX_UPLOADS_PER_USER=3
UPLOAD_WINDOW_MINUTES=5

# Authentication
VALID_SCHOOL_NUMBERS=906484,894362

# AI Integration
COHERE_API_KEY=your_cohere_api_key_here
COHERE_MODEL=command-a-03-2025
```

## Running the Server

No changes - same commands:

```bash
# Development
npm run dev

# Production
npm start

# With PM2
pm2 start server.js --name collabrio-socket-server
```

## API Endpoints (Unchanged)

All endpoints work exactly as before:

### Authentication
- `POST /validate-school` - Validate school registration numbers

### File Operations  
- `POST /upload-file` - Upload files to sessions
- `GET /download-file/:fileId` - Download shared files
- `GET /cached-image/:sessionId/:fileId` - Serve cached images

### Session Management
- `POST /inject-text` - Inject text into active sessions
- `GET /status` - Server and session status
- `GET /debug/sessions` - Debug session information
- `GET /config` - Server configuration for clients

## Socket Events (Unchanged)

All WebSocket events maintain full compatibility:

### Client to Server
- `join-session` - Join a collaborative session
- `document-change` - Update document content
- `ask-ai` - Request AI assistance
- `play-audio` - Trigger audio feedback
- `file-share-request` - Initiate file upload
- `file-chunk` - Upload file chunks

### Server to Client  
- `document-update` - Document content changes
- `user-joined` / `user-left` - User presence updates
- `file-available` - New file shared
- `ai-response-direct` - AI response for direct requests
- `server-text-injection` - Text injected by server

## Development Workflow

### Adding New Features
1. **Identify the appropriate module** or create a new one following the naming pattern
2. **Add functionality** to the specific module with clear function exports
3. **Update main server.js** if new HTTP routes needed
4. **Update socketHandlers.js** if new WebSocket events needed
5. **Test the individual module** before integration

### Debugging Process
1. **Check module-specific logs** - each module has its own console logging with prefixes
2. **Isolate issues** to specific modules using error messages
3. **Use debug endpoints** like `/debug/sessions` for session-related issues
4. **Test individual modules** using Node.js `require()` and function calls

### Testing Individual Modules

```bash
# Test syntax of individual modules
node -c config/database.js
node -c modules/sessionManager.js
node -c modules/fileManager.js
node -c modules/imageCache.js
node -c modules/aiService.js
node -c modules/fileWatcher.js
node -c routes/socketHandlers.js

# Test main server
node -c server.js

# Run server
node server.js
```

### Module Testing Examples

```javascript
// Test Database module
const Database = require('./config/database');
Database.saveSession('test-session', 'test content', Date.now());

// Test SessionManager module  
const SessionManager = require('./modules/sessionManager');
SessionManager.addClientToSession('test-session', 'client-id', {username: 'Test'});

// Test FileManager module
const FileManager = require('./modules/fileManager');
console.log(FileManager.validateFileType('image.jpg')); // Should return true
```

## Performance Impact

### ✅ Positive Impacts
- **Faster startup**: Modules only load dependencies they need
- **Better memory management**: Clear ownership of resources and cleanup
- **Easier profiling**: Performance issues can be isolated to specific modules
- **Reduced memory leaks**: Each module manages its own resources

### 📊 No Performance Loss
- **Same runtime behavior**: No additional overhead introduced
- **Same memory footprint**: Objects created exactly as before
- **Same network performance**: No changes to I/O operations
- **Same database performance**: Identical SQLite operations

## File Watching & Message Injection

The file watching system remains exactly the same:

### File-Based Message Injection
Create files in `messages/` directory:
- `{sessionId}.txt` - System message
- `{sessionId}_bot.txt` - Bot message  
- `{sessionId}_user.txt` - User message
- `{sessionId}_alert.txt` - Alert message

Files are automatically processed and moved to `messages/processed/`

### Example Usage
```bash
# System message
echo "Server maintenance in 5 minutes" > messages/abc123.txt

# Bot message
echo "🤖 Hello from automation!" > messages/abc123_bot.txt
```

## Database Schema (Unchanged)

### sessions table
- `id` (TEXT PRIMARY KEY) - Session identifier
- `document_content` (TEXT) - Current document content  
- `last_updated` (INTEGER) - Last update timestamp
- `created_at` (INTEGER) - Creation timestamp

### cached_images table
- `id` (INTEGER PRIMARY KEY) - Auto-increment ID
- `session_id` (TEXT) - Associated session
- `file_id` (TEXT) - File identifier
- `filename` (TEXT) - Original filename
- `mime_type` (TEXT) - File MIME type
- `file_size` (INTEGER) - File size in bytes
- `uploaded_by` (TEXT) - Uploader client ID
- `uploader_username` (TEXT) - Uploader display name
- `upload_timestamp` (INTEGER) - Upload time
- `file_path` (TEXT) - Filesystem path

## Production Deployment

Same PM2 commands work without changes:

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name collabrio-socket-server

# Auto-start on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs collabrio-socket-server
```

## Troubleshooting

### Module-Specific Issues

**Database module issues:**
```bash
# Check database file permissions
ls -la session.db cached_images.db

# Test database operations
node -e "const db = require('./config/database'); console.log('Database loaded successfully');"
```

**Session management issues:**
```bash
# Check active sessions
curl http://localhost:3000/debug/sessions

# Test session creation
node -e "const sm = require('./modules/sessionManager'); console.log(sm.sessions);"
```

**File upload issues:**
```bash
# Check upload directory permissions
ls -la uploads/

# Test file validation
node -e "const fm = require('./modules/fileManager'); console.log(fm.validateFileType('test.jpg'));"
```

**Image cache issues:**
```bash
# Check cached images directory
ls -la cached_images/

# Test image cache operations
curl http://localhost:3000/cached-image/session123/file456
```

### Common Module Errors

**"Module not found" errors:**
- Ensure all module files are in correct directories
- Check file permissions: `chmod 644 modules/*.js config/*.js routes/*.js`
- Verify module exports: `node -e "console.log(Object.keys(require('./modules/sessionManager')))"`

**Database connection errors:**
- Check SQLite3 installation: `npm list sqlite3`
- Verify database file permissions
- Ensure database directory is writable

## Future Enhancements

### Potential Module Improvements

1. **Database Module**
   - Connection pooling for better performance
   - Read replicas for scaling
   - Database migration system

2. **Session Manager**  
   - Redis backend for distributed sessions
   - Session clustering across multiple servers
   - Advanced user presence tracking

3. **File Manager**
   - Cloud storage integration (AWS S3, etc.)
   - File streaming for large uploads
   - Virus scanning integration

4. **Image Cache**
   - Image optimization and resizing
   - CDN integration for faster delivery  
   - Advanced caching strategies (LRU, etc.)

5. **AI Service**
   - Multiple AI provider support
   - Response caching for common queries
   - Streaming responses for better UX

### Adding New Modules

To add a new module, follow this pattern:

```javascript
// modules/newModule.js
class NewModule {
    constructor(options = {}) {
        this.config = options;
        console.log('[NewModule] Initialized');
    }

    async someMethod() {
        // Implementation
    }
}

module.exports = NewModule;
```

Then integrate in `server.js`:

```javascript
const NewModule = require('./modules/newModule');
const newModule = new NewModule(config);
```

This modular architecture provides a solid, maintainable foundation for continued development while preserving all the robust functionality of the original system. Each module can be developed, tested, and deployed independently, making the codebase much more manageable for teams and future enhancements.