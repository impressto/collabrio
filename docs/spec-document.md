# Collabrio - Real-time Collaborative Text Editor
## Technical Specification Document

**Project Name:** Collabrio  
**Version:** 2.0  
**Last Updated:** October 9, 2025  
**Status:** Production Ready  
**Repository:** `/home/impressto/work/impressto/homeserver/www/homelab/collabrio`

---

## 1. Project Overview

### 1.1 Purpose Statement
Create a web-based collaborative text editor that enables multiple users to edit a shared document in real-time through browser communication, with fallback server support for restricted networks.

### 1.2 Success Criteria
- ✅ Multiple users can collaborate on text in real-time
- ✅ No user authentication required - anonymous collaboration  
- ✅ Sessions are shareable via URL with QR code support
- ✅ Works on desktop and mobile browsers
- ✅ Falls back gracefully when peer-to-peer communication is blocked

### 1.3 Key Stakeholders
- **Primary Users:** Remote teams, students, writers needing quick collaboration
- **Secondary Users:** Developers integrating collaborative features  
- **Technical Users:** System administrators deploying the solution

### 1.4 Success Metrics
- Session creation time < 3 seconds
- Real-time sync latency < 100ms
- Support for 5+ concurrent users per session
- 99%+ uptime for WebSocket fallback server

---

## 2. Core User Stories

### Epic 1: Session Management
**Goal:** Users can create, join, and manage collaborative sessions

#### US-001: Create New Session
**As a user**, I want to create a new collaborative session so that I can start collaborating with others.

**Acceptance Criteria:**
- [ ] Landing page displays "Create New Session" button prominently
- [ ] Clicking button generates unique 6-character session ID (format: abc123)
- [ ] User is redirected to collaborative editor interface  
- [ ] Session ID is visible and copyable in the interface
- [ ] Session supports multiple concurrent users (tested with 2+ users)

**Technical Notes:**
- Session IDs use base36 encoding (0-9, a-z) for URL safety
- Total possible combinations: 36^6 = 2.1 billion
- Collision probability negligible for expected usage

**Definition of Done:** 
- Session creation tested with multiple browsers
- Session ID validation working  
- Multi-user collaboration verified

---

#### US-002: Join Existing Session  
**As a user**, I want to join an existing session so that I can collaborate with others.

**Acceptance Criteria:**
- [ ] Landing page provides session ID input field
- [ ] Valid session IDs redirect user to collaborative editor
- [ ] Invalid session IDs display helpful error message
- [ ] Users joining sessions see current document content immediately
- [ ] Session participant count updates in real-time

**Technical Notes:**
- Server maintains document state for active sessions
- New joiners receive full document sync on connection
- Session cleanup occurs when all users disconnect

**Definition of Done:** 
- Session joining tested with multiple browsers
- Error handling verified for invalid session IDs
- Document sync confirmed for late joiners

---

#### US-003: Share Session Access
**As a user**, I want to share my session with others so they can join easily.

**Acceptance Criteria:** 
- [ ] Share button opens modal with session link
- [ ] Modal displays QR code for mobile access
- [ ] Session link is copyable to clipboard with toast confirmation
- [ ] QR code contains complete session URL (protocol + domain + hash)
- [ ] Links work across different devices and browsers

**Technical Notes:**
- QR codes generated client-side using qrcode.js library
- Full URLs include protocol and domain for universal compatibility
- Toast notifications replace browser alerts for better UX

**Definition of Done:** 
- QR codes tested on mobile devices
- Link sharing verified across platforms
- Toast notifications working consistently

---

### Epic 2: Real-time Collaboration  
**Goal:** Multiple users can edit documents simultaneously

#### US-004: Real-time Text Editing
**As a user**, I want to see other users' changes instantly so we can collaborate effectively.

**Acceptance Criteria:**
- [ ] Text changes appear in real-time (< 100ms local network delay)
- [ ] Cursor position is preserved during updates  
- [ ] No conflicts when multiple users type simultaneously
- [ ] Document state persists when users join/leave session
- [ ] Large documents (1000+ words) maintain performance

**Technical Notes:**
- Primary: WebRTC peer-to-peer communication for low latency
- Fallback: WebSocket server communication for restricted networks
- Document changes broadcast to all session participants
- Server-side document storage for session persistence

**Definition of Done:** 
- Multi-user editing tested under various network conditions
- Performance verified with large documents
- Conflict resolution working correctly

---

#### US-005: Network Resilience
**As a user**, I want the system to work even when peer-to-peer connections are blocked.

**Acceptance Criteria:**
- [ ] WebSocket connection established as fallback method
- [ ] Automatic detection and fallback when WebRTC fails
- [ ] Consistent functionality regardless of connection method
- [ ] Connection status clearly indicated to users
- [ ] Reconnection attempts on network interruption

**Technical Notes:**
- Node.js + Socket.IO server for WebSocket communication
- Graceful degradation from P2P to server-mediated
- Connection health monitoring and status display

**Definition of Done:**
- WebSocket fallback tested on mobile networks
- Connection switching verified
- Reconnection logic working

---

### Epic 3: User Experience
**Goal:** Provide intuitive, accessible interface for collaboration

#### US-006: Visual Feedback System
**As a user**, I want clear feedback for my actions so I know when things work.

**Acceptance Criteria:**
- [ ] Toast notifications for copy operations (no browser alerts)
- [ ] Connection status clearly visible (connected/disconnected)
- [ ] User count displays number of active participants  
- [ ] Loading states for actions that take time
- [ ] Error messages are helpful and actionable

**Technical Notes:**
- Toast notification system with auto-dismissal (3 second timeout)
- Real-time connection status monitoring
- Progressive enhancement for user feedback

**Definition of Done:** 
- All user actions provide appropriate feedback
- Tested across major browsers (Chrome, Firefox, Safari, Edge)
- Accessibility compliance verified

---

#### US-007: Theme Support
**As a user**, I want to choose between light and dark themes for visual comfort.

**Acceptance Criteria:**
- [ ] Theme toggle button accessible in toolbar (🌙/☀️ icons)
- [ ] Complete dark theme covering all UI components
- [ ] Theme preference saved in localStorage
- [ ] Theme persists across browser sessions
- [ ] Smooth visual transitions between themes

**Technical Notes:**
- CSS custom properties for consistent theming
- localStorage persistence for user preferences
- Scoped CSS under `.collabrio-app` for embedding safety

**Definition of Done:**
- Dark theme tested across all components
- Theme persistence working
- Visual transitions smooth and consistent

---

## 3. Technical Architecture

### 3.1 System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │   Client B      │    │   Client C      │
│   (React App)   │    │   (React App)   │    │   (React App)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │  WebSocket      │
                        │  Server         │
                        │  (Node.js)      │
                        └─────────────────┘
```

### 3.2 Technology Stack

#### Frontend
- **Framework:** React 18 with hooks
- **Build Tool:** Vite for fast development and optimized builds
- **Package Manager:** Yarn for reliable dependency management
- **Styling:** CSS with scoped classes for embedding safety

#### Backend  
- **Runtime:** Node.js 18+
- **WebSocket Library:** Socket.IO for reliable real-time communication
- **Process Management:** PM2 for production deployment
- **File Watching:** Chokidar for message injection system

#### Development Tools
- **Environment Management:** Vite environment variables
- **Code Organization:** Component-based architecture
- **Documentation:** Markdown with decision tracking

### 3.3 Component Architecture
```
App.jsx (State Management)
├── LandingPage.jsx (Session Creation/Joining)
├── Header.jsx (Branding & Status)  
├── Toolbar.jsx (Actions & Controls)
├── Editor.jsx (Collaborative Text Area)
├── ShareModal.jsx (QR Code & Links)
└── Toast.jsx (User Notifications)
```

### 3.4 Communication Protocol

#### WebSocket Events
- `join-session`: User joins collaborative session
- `leave-session`: User leaves session  
- `document-change`: Text content updates
- `user-count-update`: Participant count changes
- `server-text-injection`: Automated message insertion

#### Session Management
- Sessions identified by 6-character alphanumeric codes
- Server maintains active session list with participant tracking
- Document state persisted for active sessions
- Automatic cleanup when sessions become empty

---

## 4. Configuration & Environment

### 4.1 Environment Variables

#### Frontend Configuration
```bash
# Socket server connection
VITE_SOCKET_SERVER_URL=http://localhost:3000

# Application behavior  
VITE_DEBUG=false
VITE_RECONNECTION_ATTEMPTS=5
VITE_SESSION_KEEPALIVE_INTERVAL=30000

# AI Integration (Optional)
VITE_ASK_AI_MAX_CHARS=500
VITE_AUDIO_VOLUME=0.8
```

#### Backend Configuration
```bash
# Server settings
PORT=3000
NODE_ENV=production

# AI Integration (Optional)
COHERE_API_KEY=your_api_key_here
COHERE_MODEL=command-r-03-2024
```

### 4.2 Deployment Architecture
- **Frontend:** Static files served via web server (Apache/Nginx)
- **Backend:** Node.js WebSocket server on separate port
- **Process Management:** PM2 for automatic restarts and monitoring
- **Embedding:** CSS isolation allows safe integration in external sites

---

## 5. Testing Strategy

### 5.1 Functional Testing
- [ ] Multi-user collaboration (2-5 concurrent users)
- [ ] Session creation and joining workflows  
- [ ] Real-time text synchronization accuracy
- [ ] QR code generation and mobile scanning
- [ ] Theme switching and persistence
- [ ] Toast notification system

### 5.2 Technical Testing  
- [ ] WebSocket connection stability
- [ ] Document state persistence
- [ ] Session cleanup on disconnect
- [ ] Environment variable configuration
- [ ] CSS isolation for embedding
- [ ] Performance with large documents

### 5.3 Browser Compatibility
- [ ] Chrome 90+
- [ ] Firefox 88+  
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 6. Acceptance Criteria Summary

### MVP Requirements (Must Have)
- [x] Session creation and joining
- [x] Real-time collaborative text editing
- [x] WebSocket communication
- [x] QR code sharing
- [x] Toast notification system
- [x] Theme support (light/dark)
- [x] Document persistence for active sessions

### Enhanced Features (Should Have)  
- [ ] User identity system (avatars, usernames)
- [ ] WebRTC peer-to-peer communication
- [ ] File sharing capabilities
- [ ] Mobile app optimization
- [ ] Advanced text formatting

### Future Considerations (Could Have)
- [ ] Document history and versioning
- [ ] Integrated chat system
- [ ] Advanced user permissions
- [ ] API for external integrations
- [ ] Offline editing with sync

---

## 7. Definition of Done

For this project to be considered complete:

1. **Functional Requirements:** All MVP user stories meet acceptance criteria
2. **Technical Requirements:** System architecture implemented as specified  
3. **Quality Assurance:** All tests pass across supported browsers
4. **Documentation:** Complete technical and user documentation
5. **Deployment:** Production deployment successful and stable
6. **Performance:** Meets specified latency and user load requirements

---

*This document serves as an example of specification-driven development for educational purposes. It demonstrates how to structure technical requirements, user stories, and acceptance criteria for successful project delivery.*