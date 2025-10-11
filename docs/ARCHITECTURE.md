# Collabrio Technical Architecture

## System Overview

Collabrio is a real-time collaborative text editor built on React + Socket.IO architecture designed for educational environments.

### Core Technology Stack

**Frontend (Client)**
- **React 18** with Hooks for component state management
- **Vite** for fast development and optimized builds
- **CSS Grid** for responsive layouts
- **WebSocket API** for real-time communication

**Backend (Socket Server)**  
- **Node.js** runtime environment
- **Socket.IO** for reliable WebSocket communication with fallbacks
- **File System** for message persistence and session management

**Communication**
- **WebSocket Protocol** primary connection method
- **HTTP Long Polling** automatic fallback when WebSocket blocked
- **JSON Message Format** for all client-server communication

## Component Architecture

### Frontend Components (`/client/src/components/`)

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

**Audio System:**
- `FloatingIcon.jsx` - Animated emoji feedback for audio events
- `AudioSelectorPopup.jsx` - Grid-based audio selection interface
- `SharedAudioManager.js` - Centralized audio functionality utility

### Backend Structure (`/socket-server/`)

**Core Files:**
- `server.js` - Main Socket.IO server with event handling
- `admin.html` - Server monitoring and session management interface
- `messages/` - Session persistence and message logging

**Key Features:**
- Session-based message storage
- Real-time event broadcasting  
- User join/leave management
- Message history replay for new connections

## Data Flow

### Session Lifecycle
1. **User Access** → Generate/join session ID → Load existing messages
2. **Real-time Sync** → Edit events → Broadcast to all users → Update storage
3. **New User Join** → Receive message history → Sync to current state
4. **Session Persistence** → Messages stored as files → Available across server restarts

### Audio System Flow
1. **User Selection** → Audio selector popup → Choice broadcast to all users
2. **Sound Playback** → Local audio + floating icon animation → Visual feedback
3. **Deduplication** → ID-based tracking prevents duplicate animations
4. **State Management** → SharedAudioManager handles all audio logic

## Configuration System

### Environment Variables
```bash
# Client Configuration (client/.env)
VITE_SOCKET_SERVER_URL=wss://your-server.com    # WebSocket endpoint
VITE_BASE_URL=https://your-domain.com           # Base URL for sharing
VITE_DEBUG=true                                 # Enable debug logging

# Production Deployment
NODE_ENV=production                             # Production optimizations
```

### School Authentication
- Predefined school codes in `schoolUtils.js`
- Session-based authentication state
- Optional feature - can operate without authentication

## File Structure & Organization

```
/client/                 # Frontend React application
  /src/
    /components/         # React components
    /config/            # Configuration utilities  
    /utils/             # Helper functions
    /assets/            # Static resources
  /public/              # Static files served by Vite

/socket-server/         # Backend WebSocket server
  /messages/           # Session persistence storage
  /processed/         # Archived message logs
  
/docs/                  # Documentation
  /archive/            # Historical detailed documentation
```

## Performance Optimizations

### Frontend Optimizations
- **Component Memoization** - React.memo for expensive renders
- **Animation Performance** - requestAnimationFrame with early termination
- **Bundle Size** - Vite tree shaking and code splitting
- **State Updates** - Batched updates for real-time synchronization

### Backend Optimizations  
- **Message Batching** - Efficient broadcast handling
- **File I/O** - Async message persistence
- **Memory Management** - Session cleanup and garbage collection
- **Connection Pooling** - Socket.IO built-in optimization

## Security Considerations

### Data Security
- **No User Data Storage** - Anonymous sessions only
- **Session Isolation** - Each session completely isolated
- **No Authentication Required** - Reduces attack surface
- **Optional School Auth** - Additional verification when needed

### Network Security
- **HTTPS/WSS Only** - Encrypted connections in production
- **CORS Configuration** - Controlled cross-origin access
- **Input Sanitization** - Basic XSS prevention
- **Rate Limiting** - Prevents spam and abuse

## Deployment Architecture

### Development Environment
```bash
# Concurrent development servers
npm run dev              # Both client (5173) + socket server (3001)
```

### Production Environment  
```bash
# Build and deploy
npm run build           # Generates /dist folder
# Deploy /dist to static hosting (Netlify, Vercel, etc.)  
# Deploy socket-server to Node.js hosting (Railway, Render, etc.)
```

### CSS Isolation for Embedding
- **Scoped Styles** - All CSS prefixed to prevent conflicts
- **Iframe Compatibility** - Designed for safe embedding
- **Responsive Design** - Works across device sizes
- **Theme System** - Light/dark themes with persistence