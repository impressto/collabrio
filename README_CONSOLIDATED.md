# Collabrio - Real-time Collaborative Clipboard

**Version:** 2.2 | **Status:** Production Ready | **Updated:** November 13, 2025

![collabrio-screen2](https://github.com/user-attachments/assets/27e63d80-d0b3-498c-9b80-87aa1104f116)

## 🎯 Overview

**Collabrio** is an anonymous collaborative text editor designed for educational environments. Students can collaborate on documents in real-time with fun interactive features including games, audio reactions, and seamless mobile support.

### ✨ Key Features

- 📝 **Anonymous Collaboration** - No signup required, share via URL/QR code
- 🎵 **Shared Audio System** - 25+ reaction sounds with floating icon animations
- 🎮 **Interactive Games** - Drawing game with mobile touch controls
- 🖼️ **Image Sharing** - Upload, cache, and manage images with thumbnails
- 🏫 **School Authentication** - Restricted access to authorized educational institutions
- 📱 **Mobile Optimized** - Touch-friendly interface with gesture controls
- 🌙 **Dark/Light Themes** - Student preference support
- ⚡ **Real-time Sync** - WebSocket with P2P fallback
- 🔒 **CSS Isolation** - Safe embedding without conflicts

### 🎯 Use Cases

Designed for classroom collaboration where students need:
- Quick session creation without accounts
- Fun, engaging audio feedback and games
- Mobile-friendly interface for BYOD environments
- Teacher control through school authentication
- Anonymous participation to reduce social pressure

---

## 🚀 Quick Start

### Installation & Setup

```bash
# Clone repository  
git clone [repository-url]
cd collabrio

# Install dependencies for all components
npm install
cd client && npm install && cd ..
cd socket-server && npm install && cd ..

# Development mode
npm run dev          # Starts both client and socket server
# OR run individually:
cd client && npm run dev     # Client only (port 5173)
cd socket-server && npm run dev  # Socket server only (port 3001)

# Production build
npm run build        # Builds client to dist/
yarn build          # Alternative using Yarn
```

### Configuration

**Environment Variables** (client/.env):
```bash
VITE_SOCKET_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_SCHOOL_AUTH_URL=https://your-school-api.com
```

**Socket Server** (socket-server/.env):
```bash
PORT=3001
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

### Quick Development Start

1. **Terminal 1** - Socket Server: `cd socket-server && npm run dev`
2. **Terminal 2** - Client: `cd client && npm run dev`
3. **Open** http://localhost:5173/homelab/

---

## 🏗️ Architecture

### Technology Stack

**Frontend (Client)**
- **React 18** with Hooks for state management
- **Vite** for fast development and optimized builds
- **CSS Grid** for responsive layouts
- **WebSocket API** for real-time communication

**Backend (Socket Server)**
- **Node.js** runtime environment
- **Socket.IO** for reliable WebSocket communication with fallbacks
- **SQLite** for image cache metadata and session persistence
- **File System** for message persistence and session management

**Communication**
- **WebSocket Protocol** primary connection method
- **HTTP Long Polling** automatic fallback when WebSocket blocked
- **JSON Message Format** for all client-server communication

### Component Architecture

#### Frontend Components (`/client/src/components/`)

**Core Components:**
- `App.jsx` - Main application container and state management
- `Editor.jsx` - Collaborative text editing interface
- `Header.jsx` - Navigation and theme controls
- `Footer.jsx` - Status display and utility actions

**Feature Components:**
- `ShareModal.jsx` - QR code generation and URL sharing
- `IdentityModal.jsx` - Username and avatar selection
- `SchoolAuthModal.jsx` - School-based authentication system
- `UserList.jsx` - Active collaborator display
- `Toast.jsx` - Notification system
- `UploadProgress.jsx` - File upload feedback
- `ImageThumbnail.jsx` - Image preview, download, and cache management

**Game Components:**
- `GameContainer.jsx` - Game modal management
- `DrawingGame.jsx` - Collaborative drawing with touch support
- `WordSelection.jsx` - Drawing game word selection

**Audio System:**
- `FloatingIcon.jsx` - Animated emoji feedback for audio events
- `AudioSelectorPopup.jsx` - Grid-based audio selection interface
- `SharedAudioManager.js` - Centralized audio functionality

#### Backend Structure (`/socket-server/`)

**Core Files:**
- `server.js` - Express server and Socket.IO setup
- `modules/sessionManager.js` - Session creation and persistence
- `modules/fileManager.js` - File upload and download handling
- `modules/imageCache.js` - Image caching and metadata management
- `modules/gameManager.js` - Drawing game logic
- `modules/aiService.js` - AI integration for enhanced features

**Database:**
- `config/database.js` - SQLite configuration for image metadata
- `messages/` - Persistent message storage by session
- `cached-images/` - Image file storage with automatic cleanup

---

## 🎮 Games & Interactive Features

### Drawing Game
**Collaborative sketch guessing game with full mobile support**

**Features:**
- Real-time drawing synchronization
- Word selection and guessing mechanics
- Mobile touch drawing support
- Cross-platform compatibility (mouse + touch)

**Mobile Drawing Fix (Latest):**
- ✅ Touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`)
- ✅ Enhanced `getCanvasPoint()` for mouse and touch events
- ✅ `touch-action: none` to prevent scrolling/zooming
- ✅ Passive event listeners for performance

---

## 🖼️ Image & File Management

### Image System Features
- **Upload & Share** - Drag-and-drop or click to upload images
- **Automatic Caching** - Server-side image storage with metadata
- **Thumbnail Previews** - Quick image preview with download options
- **Cache Management** - Delete cached images with confirmation
- **Mobile Optimized** - Touch-friendly image interactions

### File Upload Process
1. **Client Upload** - Files uploaded to `/upload` endpoint
2. **Server Processing** - Files saved to session-specific directories
3. **Cache Storage** - Images cached with SQLite metadata tracking
4. **Real-time Sync** - All users receive file notifications instantly
5. **Cleanup** - Automatic cleanup of old cached files

---

## 🔗 Embedding & Integration

### Safe Embedding
Collabrio is designed to be safely embedded without CSS conflicts using comprehensive isolation techniques.

#### Method 1: Iframe Embed (Recommended)
```html
<iframe 
  src="https://your-domain.com/collabrio/" 
  width="100%" 
  height="600px"
  frameborder="0"
  title="Collabrio Collaborative Editor"
></iframe>
```

#### Method 2: Direct Integration
```html
<div id="collabrio-embed"></div>
<script type="module">
  import('/path/to/collabrio/assets/index.js');
</script>
```

### CSS Isolation Features
- **Scoped Selectors** - All styles prefixed with `.collabrio-app`
- **CSS Reset Protection** - Isolated from host page resets
- **Font Isolation** - Self-contained typography
- **Z-index Management** - Controlled layering system
- **Media Query Isolation** - Responsive behavior contained

### Custom Integration Options
```javascript
// Custom theming
window.collabrioConfig = {
  theme: 'dark',
  schoolAuth: 'https://your-school-api.com',
  audioEnabled: true,
  gamesEnabled: true
};
```

---

## 🔧 Configuration & Deployment

### Environment Configuration

#### Client Configuration (`client/.env`)
```bash
# Required
VITE_SOCKET_URL=ws://your-domain.com:3001
VITE_API_URL=https://your-domain.com:3001

# Optional
VITE_SCHOOL_AUTH_URL=https://your-school-auth-api.com
VITE_DEFAULT_THEME=light
VITE_AUDIO_ENABLED=true
VITE_GAMES_ENABLED=true
```

#### Server Configuration (`socket-server/.env`)
```bash
# Server
PORT=3001
NODE_ENV=production

# CORS & Security
CLIENT_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com,https://other-domain.com
ALLOWED_ORIGINS=https://your-domain.com

# Features
MAX_FILE_SIZE=10485760  # 10MB
SESSION_TIMEOUT=3600000 # 1 hour
CLEANUP_INTERVAL=300000 # 5 minutes
```

### Production Deployment

#### Build Process
```bash
# Build client
cd client && npm run build

# Build creates dist/ folder with:
# - index.html (entry point)
# - assets/ (JS, CSS, images)
# - Optimized bundles with code splitting
```

#### Server Deployment
```bash
# Install production dependencies
cd socket-server && npm ci --production

# Start production server
npm start
# OR with process manager
pm2 start server.js --name collabrio-server
```

#### Docker Deployment (Optional)
```dockerfile
# Multi-stage build for optimized production
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY socket-server/ ./
RUN npm ci --production
COPY --from=client-build /app/client/dist ./public
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 📚 API Documentation

### Socket.IO Events

#### Client → Server Events
```javascript
// Session Management
socket.emit('join-session', { sessionId, userIdentity })
socket.emit('leave-session', { sessionId })

// Text Collaboration  
socket.emit('text-change', { sessionId, content, timestamp })
socket.emit('cursor-position', { sessionId, position, selection })

// Audio & Reactions
socket.emit('audio-event', { sessionId, audioId, username, timestamp })

// Games
socket.emit('start-drawing-game', { sessionId, starter })
socket.emit('drawing-update', { sessionId, drawingData })
socket.emit('game-guess', { sessionId, guess, username })

// File Management
socket.emit('request-file-list', { sessionId })
socket.emit('delete-cached-image', { sessionId, fileId })
```

#### Server → Client Events
```javascript
// Session Updates
socket.on('user-joined', ({ user, sessionUsers }))
socket.on('user-left', ({ user, sessionUsers }))
socket.on('session-state', ({ content, users, files }))

// Real-time Collaboration
socket.on('text-updated', ({ content, user, timestamp }))
socket.on('cursor-updated', ({ user, position, selection }))

// Audio & Visual Effects
socket.on('audio-played', ({ audioId, user, timestamp }))
socket.on('floating-icon', ({ emoji, username, position }))

// Game Events
socket.on('game-started', ({ gameType, drawer, word, timeLeft }))
socket.on('drawing-update', ({ drawingData }))
socket.on('game-ended', ({ winners, correctWord }))

// File System
socket.on('file-uploaded', ({ fileInfo }))
socket.on('file-list-updated', ({ files }))
socket.on('cached-image-deleted', ({ fileId }))
```

### REST API Endpoints

#### File Management
```bash
# Upload files
POST /upload
Content-Type: multipart/form-data
Body: file, sessionId

# Download files  
GET /download/:sessionId/:filename

# Delete cached images
DELETE /cached-image/:sessionId/:fileId

# Get file list
GET /files/:sessionId
```

#### Configuration
```bash
# Get client configuration
GET /config
Response: { socketUrl, apiUrl, features }

# Health check
GET /health
Response: { status, uptime, connections }
```

---

## 🧪 Development & Testing

### Development Workflow

#### Hot Reload Development
```bash
# Terminal 1: Start socket server with nodemon
cd socket-server && npm run dev

# Terminal 2: Start Vite dev server  
cd client && npm run dev

# Both servers auto-reload on changes
```

#### Code Quality
```bash
# Linting
cd client && npm run lint

# Type checking (if TypeScript)
cd client && npm run type-check

# Testing
npm test                    # Run all tests
npm run test:client        # Client tests only
npm run test:server        # Server tests only
```

### Testing Checklist

#### Core Functionality
- [ ] **Multi-user editing** - Text sync across multiple browsers
- [ ] **Real-time updates** - Changes appear within 100ms
- [ ] **Session persistence** - Content survives page refresh
- [ ] **Mobile compatibility** - Touch interactions work properly

#### Games & Interaction
- [ ] **Drawing game** - Touch drawing works on mobile
- [ ] **Audio system** - Sound effects play correctly
- [ ] **File uploads** - Images upload and cache properly

#### Cross-browser Testing
- [ ] **Chrome/Edge** - Full feature support
- [ ] **Firefox** - WebSocket and audio compatibility  
- [ ] **Safari** - iOS touch events and audio
- [ ] **Mobile browsers** - Touch gestures and responsive design

---

## 🔄 Recent Updates & Changelog

### Version 2.2 (November 13, 2025)
#### 🆕 Mobile Touch Controls
- **Drawing Game Touch Support** - Full mobile drawing capability
- **Enhanced Touch Events** - Better preventDefault and touch-action handling
- **Cross-platform Compatibility** - Unified mouse and touch event handling

### Version 2.1 (October 2025)
#### 🎮 Game System Integration
- **Game Container Architecture** - Unified game modal system
- **Drawing Game Enhancements** - Word selection and multiplayer drawing
- **Mobile Game Optimization** - Touch-friendly game controls

### Version 2.0 (October 2025)
#### 🖼️ Image Cache Management System
- **Delete Functionality** - Users can delete cached images from server
- **Confirmation Dialogs** - Prevent accidental deletion with prompts
- **Real-time Updates** - Image deletions sync across all participants
- **Cache Status Display** - Clear indication of cached vs. non-cached images

#### 📱 Enhanced Mobile Experience
- **Scrollable Image Modal** - Large images no longer hide action buttons
- **Touch Optimizations** - Improved mobile interactions and space utilization
- **Responsive Controls** - Always accessible download and delete buttons

#### 🔧 Technical Improvements
- **SQLite Integration** - Database support for cached image metadata
- **API Endpoints** - RESTful image management endpoints
- **Socket.IO Events** - Real-time notifications for image operations
- **Configuration Management** - Fixed client config fetching errors

---

## 🏛️ Architecture Decisions

### Key Technical Decisions

#### ADR-001: Architecture Decision Records
**Decision:** Use structured ADRs for documenting architectural choices
**Rationale:** Industry standard format, AI-friendly, searchable decision history

#### ADR-002: Shared Audio Manager Extract
**Decision:** Centralize audio functionality in dedicated utility module
**Rationale:** Reduce code duplication, improve maintainability, enable consistent audio behavior

#### ADR-003: CSS Isolation Strategy
**Decision:** Comprehensive CSS isolation using prefixed selectors
**Rationale:** Enable safe embedding without conflicts, maintain design consistency

#### ADR-004: Image Thumbnail System
**Decision:** Server-side image processing with client-side thumbnail display
**Rationale:** Optimize bandwidth, improve user experience, reduce client processing

#### ADR-005: Username Integration
**Decision:** Include username in all file and interaction events
**Rationale:** Enhanced user attribution, better collaboration awareness, audit trail

#### ADR-006: Image Cache Deletion
**Decision:** User-initiated cache deletion with confirmation dialogs
**Rationale:** User control over shared resources, prevent accidental deletion, real-time sync

#### ADR-007: Scrollable Image Modal Design
**Decision:** Flexible modal layout with scrollable content areas
**Rationale:** Support large images, maintain accessible controls, responsive design

---

## 🔒 Security & Privacy

### Privacy Features
- **Anonymous Sessions** - No personal data required
- **Temporary Storage** - Sessions auto-expire after inactivity
- **School Authentication** - Optional institutional access control
- **File Cleanup** - Automatic removal of uploaded files

### Security Measures
- **CORS Protection** - Configured allowed origins
- **File Type Validation** - Restricted upload file types
- **Size Limits** - Configurable file size restrictions
- **Input Sanitization** - Text content filtering
- **WebSocket Security** - Origin validation and rate limiting

---

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
```bash
# WebSocket connection failed
- Check VITE_SOCKET_URL matches server port
- Verify CORS origins include client domain
- Test with HTTP polling fallback

# Mobile touch not working
- Ensure touch-action: none is applied
- Check preventDefault calls in touch handlers
- Verify touch event listeners are attached
```

#### Build Issues
```bash
# Vite build failures
cd client && rm -rf node_modules dist && npm install && npm run build

# Socket server startup errors
cd socket-server && rm -rf node_modules && npm install
```

#### Performance Issues
```bash
# High memory usage
- Check for WebSocket connection leaks
- Monitor file upload cleanup
- Verify session expiration is working

# Slow real-time updates  
- Test network latency between client/server
- Check Socket.IO connection quality
- Monitor server resource usage
```

---

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install && cd client && npm install && cd ../socket-server && npm install`
4. Start development servers (see Quick Start)
5. Make changes with tests
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open Pull Request

### Code Style
- **ESLint** - Follow configured linting rules
- **Prettier** - Use for consistent formatting
- **Comments** - Document complex logic and architecture decisions
- **Component Structure** - Keep components focused and reusable

### Testing Guidelines
- **Unit Tests** - Test individual component functionality
- **Integration Tests** - Test Socket.IO event handling
- **Manual Testing** - Cross-browser and mobile device testing
- **Performance Testing** - Monitor real-time collaboration under load

---

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 🙋‍♂️ Support

For issues, questions, or contributions:
- **Issues**: GitHub Issues for bug reports and feature requests  
- **Documentation**: All docs consolidated in this README
- **Architecture**: See embedded ADR decisions above
- **Development**: Follow contributing guidelines for setup

**Created for educational collaboration with ❤️**