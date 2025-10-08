# Collabrio - Memory Document

*Living documentation of project decisions, lessons learned, and organizational knowledge*  
*Last Updated: October 8, 2025 - Document State Persistence for New Session Joiners*  
*References: [spec-document.md](./spec-document.md)*

## 🏢 Project Information

**Project Name:** Collabrio - Real-time Collaborative Text Editor  
**Description:** A WebRTC-based collaborative text editor with file sharing capabilities, featuring fallback to WebSocket for restricted networks  
**Team:** [To be updated as team members are identified]  
**Start Date:** October 4, 2025  
**Current Phase:** Development - Core Features + Automation Integration Complete  
**Repository:** /home/impressto/work/impressto/homeserver/www/homelab/collabrio  
**Live Demo:** Local development at http://localhost:5174 (Socket server: localhost:3000)  

## 📋 Decision Log

### Technology Stack Selection
**Date:** 2025-10-04  
**Description:** Selected React for frontend and Node.js for backend socket server  
**Rationale:** React provides robust component-based architecture for real-time collaborative UI, Node.js enables efficient WebSocket handling and is well-suited for real-time applications  
**Status:** Decided  
**Impact:** High - Foundation for entire application architecture  
**Stakeholders:** Development team  
**Implementation:** To be implemented during development phase  

**Alternatives Considered:**
- **Vue.js + Express:** Considered but React has better WebRTC ecosystem support
- **Vanilla JS + Socket.io:** Would be lighter but more complex to maintain for collaborative features

**Follow-up Actions:**
- [ ] Set up React development environment (Dev Team - TBD)
- [ ] Create Node.js socket server structure (Dev Team - TBD)

---

### WebRTC with WebSocket Fallback Architecture
**Date:** 2025-10-04  
**Description:** Implement WebRTC as primary connection method with WebSocket fallback for restricted networks  
**Rationale:** WebRTC provides direct peer-to-peer communication with lower latency, but mobile networks often block it, requiring WebSocket fallback via socket.impressto.ca  
**Status:** Decided  
**Impact:** High - Core communication strategy affects all real-time features  
**Stakeholders:** Development team, end users on mobile networks  
**Implementation:** To be implemented with connection detection and automatic fallback  

**Alternatives Considered:**
- **WebSocket only:** Simpler but higher server load and latency
- **WebRTC only:** Better performance but would fail on restricted networks

**Follow-up Actions:**
- [ ] Implement WebRTC connection establishment (Dev Team - TBD)
- [ ] Create WebSocket fallback detection (Dev Team - TBD)
- [ ] Set up socket.impressto.ca server (Dev Team - TBD)

---

### Anonymous Usage Model
**Date:** 2025-10-04  
**Description:** No user authentication required, sessions accessible via URL hash  
**Rationale:** Simplifies user experience, reduces privacy concerns, faster session initiation  
**Status:** Decided  
**Impact:** Medium - Affects security model and user management  
**Stakeholders:** Development team, end users  
**Implementation:** Sessions identified by URL hash, no user accounts or authentication  

**Alternatives Considered:**
- **User accounts:** Would provide better session management but adds complexity
- **Guest accounts:** Middle ground but still adds unnecessary friction

**Follow-up Actions:**
- [ ] Design session URL hash generation (Dev Team - TBD)
- [ ] Implement session management without authentication (Dev Team - TBD)

---

### Frontend Build Tooling Selection
**Date:** 2025-10-04  
**Description:** Selected Vite as build tool and Yarn as package manager for React frontend  
**Rationale:** Vite provides fast development server with hot module replacement, optimized for modern React development. Yarn offers reliable dependency management and faster installs than npm  
**Status:** Decided  
**Impact:** Medium - Affects development workflow and build process  
**Stakeholders:** Development team  
**Implementation:** To be implemented during frontend setup  

**Alternatives Considered:**
- **Create React App + npm:** Traditional approach but slower dev server and larger bundle
- **Webpack + npm:** More configuration required, slower than Vite

**Follow-up Actions:**
- [x] Initialize React project with Vite (Dev Team - 2025-10-04)
- [x] Configure Yarn for package management (Dev Team - 2025-10-04)
- [x] Set up development environment (Dev Team - 2025-10-04)
- [x] Set up git repository with proper .gitignore (Dev Team - 2025-10-04)

---

### Project Repository Initialization  
**Date:** 2025-10-04  
**Description:** Initialized git repository with proper .gitignore configuration for frontend and backend  
**Rationale:** Proper version control setup prevents tracking of node_modules and sensitive files, ensures clean repository history  
**Status:** Implemented  
**Impact:** Medium - Foundation for version control and collaboration  
**Stakeholders:** Development team  
**Implementation:** Created root .gitignore covering both client and socket-server directories, made initial commit  

**Follow-up Actions:**
- [x] Create root-level .gitignore (Dev Team - 2025-10-04)
- [x] Initial git commit (Dev Team - 2025-10-04)

---

### Multi-User Collaboration Testing Success
**Date:** 2025-10-04  
**Description:** Successfully tested and verified real-time collaborative editing between multiple clients  
**Rationale:** Confirming core functionality works before building additional features ensures solid foundation  
**Status:** Implemented  
**Impact:** High - Core product functionality validated  
**Stakeholders:** Development team, end users  
**Implementation:** Verified multiple browser clients can join same session and see real-time text updates from other users  

**Test Results:**
- **WebSocket Connection:** ✅ Multiple clients connect successfully
- **Session Management:** ✅ URL hash-based sessions working
- **Real-time Sync:** ✅ Text changes propagate instantly between clients
- **User Counter:** ✅ Shows accurate number of connected users
- **Session Joining:** ✅ Manual session ID entry working
- **QR Code Sharing:** ✅ Shareable links generate correctly
- **File-Based Injection:** ✅ Automated message injection from filesystem working
- **Message Type Support:** ✅ Multiple message types (system, bot, admin) working
- **File Processing:** ✅ Automatic archival and cleanup working

**Follow-up Actions:**
- [x] Test same-session collaboration (Dev Team - 2025-10-04)
- [x] Verify session isolation (Dev Team - 2025-10-04)
- [x] Confirm user count accuracy (Dev Team - 2025-10-04)
- [x] Test file-based injection system (Dev Team - 2025-10-05)
- [x] Verify message type parsing (Dev Team - 2025-10-05)
- [x] Test file archival system (Dev Team - 2025-10-05)
- [ ] Test on mobile devices (Dev Team - TBD)
- [ ] Performance testing with many users (Dev Team - TBD)

---

### Explicit Session Creation Model
**Date:** 2025-10-04  
**Description:** Redesigned session creation to require explicit user action rather than auto-generating sessions  
**Rationale:** Better user experience with clear session control, prevents accidental session creation, improves session sharing UX  
**Status:** Implemented  
**Impact:** High - Fundamental change to user interaction model  
**Stakeholders:** Development team, end users  
**Implementation:** Added landing page with "Create New Session" button, session joining input, and leave session functionality  

**Changes Made:**
- **Landing Page:** New interface for session creation and joining
- **Explicit Creation:** "Create New Session" button generates session ID
- **Session Control:** Users can leave sessions and return to landing page
- **Visual Design:** Gradient landing page with clear call-to-action buttons
- **State Management:** Added `isInSession` state to control UI flow

**Follow-up Actions:**
- [x] Implement landing page UI (Dev Team - 2025-10-04)
- [x] Add session creation button (Dev Team - 2025-10-04)
- [x] Add session joining input (Dev Team - 2025-10-04)
- [x] Add leave session functionality (Dev Team - 2025-10-04)
- [x] Style landing page (Dev Team - 2025-10-04)
- [ ] Test new session creation workflow (Dev Team - In Progress)

---

### Server Text Injection Experiment
**Date:** 2025-10-05  
**Description:** Implemented experimental server-side text injection capability for system messages and bot interactions  
**Rationale:** Enables server-initiated communication with collaborative sessions for notifications, announcements, or automated interactions  
**Status:** Implemented and Tested  
**Impact:** Medium - Opens possibilities for server-side features and automation  
**Stakeholders:** Development team, potential admin users  
**Implementation:** Added REST endpoint `/inject-text` and WebSocket event `server-text-injection` with formatted message display  

**Technical Details:**
- **REST Endpoint:** `POST /inject-text` with sessionId, text, and type parameters
- **Socket Event:** `server-text-injection` broadcasts to all session clients
- **Message Formatting:** `[TYPE] message` format for clear identification
- **Error Handling:** Validates session existence and required parameters
- **Response Data:** Confirms injection success and client notification count

**Test Results:**
- ✅ Successfully injected text into active sessions
- ✅ All connected clients received and displayed messages
- ✅ Different message types (system, bot, admin) working
- ✅ Proper error handling for invalid sessions
- ✅ Real-time delivery confirmed

**Follow-up Actions:**
- [x] Implement REST endpoint (Dev Team - 2025-10-05)
- [x] Add client-side event handler (Dev Team - 2025-10-05)
- [x] Test message injection (Dev Team - 2025-10-05)
- [x] Create test script (Dev Team - 2025-10-05)
- [x] Implement file-based injection system (Dev Team - 2025-10-05)
- [x] Add file watcher with chokidar (Dev Team - 2025-10-05)
- [x] Create demo script for file injection (Dev Team - 2025-10-05)
- [x] Update documentation with injection details (Dev Team - 2025-10-05)
- [ ] Consider admin web interface (Dev Team - TBD)
- [ ] Add message history/persistence (Dev Team - TBD)

---

### File-Based Message Injection System
**Date:** 2025-10-05  
**Description:** Implemented automated file-watching system for message injection using filesystem monitoring with chokidar  
**Rationale:** Enables external automation tools, scripts, and systems to inject messages into collaborative sessions without direct API calls, providing a simple file-drop interface for integration  
**Status:** Implemented and Tested  
**Impact:** High - Opens new automation possibilities and simplifies integration with external systems  
**Stakeholders:** Development team, automation tools, admin users, external integrations  
**Implementation:** Added chokidar file watcher, automatic file processing, message parsing, and processed file archival system  

**Technical Details:**
- **File Naming Convention:** `{sessionId}.txt` (system) or `{sessionId}_{type}.txt` (typed messages)
- **Watch Directory:** `socket-server/messages/` with automatic creation
- **File Processing:** Automatic detection, parsing, injection, and archival to `processed/` folder
- **Message Types:** Support for system, bot, user, alert, admin, and custom types
- **Error Handling:** Validates session existence, file content, and handles processing errors
- **Archive System:** Processed files moved with timestamps to prevent reprocessing

**Features Implemented:**
- **Automatic File Detection:** Chokidar watches for file additions and changes
- **Session Validation:** Only processes files for active sessions with clients
- **Message Type Parsing:** Extracts message type from filename (e.g., `abc123_bot.txt`)
- **Real-time Injection:** Messages appear instantly in all connected clients
- **File Archival:** Processed files timestamped and moved to `processed/` directory
- **Demo Script:** `demo-file-injection.sh` for testing and demonstration

**Test Results:**
- ✅ File watcher detects new .txt files in messages directory
- ✅ Session ID and message type parsed correctly from filenames
- ✅ Messages injected into correct sessions with proper formatting
- ✅ Files processed and archived automatically with timestamps
- ✅ Only active sessions receive messages (inactive sessions ignored)
- ✅ Demo script successfully demonstrates all functionality

**Follow-up Actions:**
- [x] Implement chokidar file watcher (Dev Team - 2025-10-05)
- [x] Add filename parsing for session ID and type (Dev Team - 2025-10-05)
- [x] Create processed file archival system (Dev Team - 2025-10-05)
- [x] Test automated injection workflow (Dev Team - 2025-10-05)
- [x] Create demonstration script (Dev Team - 2025-10-05)
- [x] Document file naming conventions (Dev Team - 2025-10-05)
- [ ] Add file size limits and security validation (Dev Team - TBD)
- [ ] Create web interface for file management (Dev Team - TBD)

---

### Enhanced Documentation and Configuration
**Date:** 2025-10-05  
**Description:** Comprehensive updates to README documentation and Vite configuration for improved development experience  
**Rationale:** Better documentation enables easier onboarding, deployment, and integration while configuration improvements streamline development workflow  
**Status:** Implemented  
**Impact:** Medium - Improves maintainability and developer experience  
**Stakeholders:** Development team, future contributors, deployment teams  
**Implementation:** Enhanced socket server README with complete API documentation, examples, and deployment guides; updated Vite configuration for better development experience

---

### Application Rebranding from Clippy to Collabrio
**Date:** 2025-10-07  
**Description:** Complete rebranding of the application from "Clippy" to "Collabrio" across all project files, documentation, and user interfaces  
**Rationale:** "Collabrio" better represents the collaborative nature of the application and avoids potential trademark conflicts with Microsoft's Clippy assistant  
**Status:** Implemented  
**Impact:** Medium - Improves brand identity and clarity of purpose  
**Stakeholders:** Development team, end users, documentation  
**Implementation:** Updated all references in frontend components, backend services, documentation, package names, CSS classes, and deployment scripts

**Changes Made:**
- **Frontend UI:** Updated app title, headers, and CSS class names from clippy-* to collabrio-*
- **Documentation:** Renamed in spec document, memory document, and README files
- **Backend Services:** Updated package.json, deployment scripts, and admin interface
- **Visual Identity:** Changed emoji from 📎 (paperclip) to 🤝 (handshake) to represent collaboration
- **CSS Classes:** Renamed .clippy-container to .collabrio-container and .clippy-header to .collabrio-header

**Follow-up Actions:**
- [x] Update frontend React components (Dev Team - 2025-10-07)
- [x] Update CSS class names and styles (Dev Team - 2025-10-07)
- [x] Update backend package names and descriptions (Dev Team - 2025-10-07)
- [x] Update all documentation files (Dev Team - 2025-10-07)
- [x] Update deployment scripts and PM2 process names (Dev Team - 2025-10-07)
- [x] Update admin interface branding (Dev Team - 2025-10-07)
- [x] Regenerate package-lock.json with new names (Dev Team - 2025-10-07)
- [ ] Update any external documentation or links (Dev Team - TBD)
- [ ] Consider updating favicon and other visual assets (Dev Team - TBD)

---

### Environment Variable Configuration System
**Date:** 2025-10-07  
**Description:** Implemented comprehensive environment variable system using Vite's built-in .env support for configurable socket server URLs and other settings  
**Rationale:** Hardcoded URLs make deployment and testing difficult. Using Vite environment variables provides a standard, maintainable way to configure the application for different environments (development, production, testing)  
**Status:** Implemented  
**Impact:** High - Improves deployment flexibility and development workflow  
**Stakeholders:** Development team, deployment team, testers  
**Implementation:** Added .env file support, configuration utility, test config generator, and comprehensive documentation

**Features Implemented:**
- **Vite Environment Variables:** Full support for VITE_* environment variables in React components
- **Configuration Utility:** Centralized config.js module for consistent environment variable access
- **Test Config Generator:** Node.js script to generate config for standalone HTML files
- **Multiple Environment Support:** .env, .env.development, .env.production, .env.local files
- **Comprehensive Documentation:** ENV_CONFIGURATION.md with complete setup instructions

**Environment Variables Added:**
- `VITE_SOCKET_SERVER_URL` - Configurable socket server URL (replaces hardcoded localhost:3000)
- `VITE_DEBUG` - Debug logging control
- `VITE_RECONNECTION_ATTEMPTS` - Socket reconnection settings
- `VITE_SESSION_KEEPALIVE_INTERVAL` - Session maintenance interval

**Files Created/Modified:**
- `client/.env` - Default environment configuration
- `client/.env.example` - Example configuration template
- `client/.env.production` - Production environment overrides
- `client/src/config.js` - Configuration utility module
- `generate-test-config.js` - Config generator for standalone HTML files
- `ENV_CONFIGURATION.md` - Comprehensive setup documentation

**Follow-up Actions:**
- [x] Create .env files with VITE_ prefixed variables (Dev Team - 2025-10-07)
- [x] Update React components to use environment variables (Dev Team - 2025-10-07)
- [x] Create configuration utility module (Dev Team - 2025-10-07)
- [x] Add test config generator for standalone HTML (Dev Team - 2025-10-07)
- [x] Update package.json scripts for config generation (Dev Team - 2025-10-07)
- [x] Create comprehensive environment documentation (Dev Team - 2025-10-07)
- [x] Update .gitignore for generated config files (Dev Team - 2025-10-07)
- [ ] Test production deployment with environment variables (Dev Team - TBD)
- [ ] Add environment validation and error handling (Dev Team - TBD)

---

### CSS Isolation for Multi-Tenant Embedding
**Date:** 2025-10-08  
**Description:** Implemented comprehensive CSS isolation system to enable safe embedding of Collabrio in external websites without style conflicts  
**Rationale:** Multiple companies want to embed Collabrio in their websites. Without CSS isolation, the app's styles would conflict with host page styles, causing visual and functional issues  
**Status:** Implemented  
**Impact:** High - Enables safe multi-tenant deployment and embedding in any website  
**Stakeholders:** Development team, client companies, end users  
**Implementation:** Scoped all CSS under `.collabrio-app` namespace, added CSS reset and isolation, created embedding documentation and test files

**CSS Isolation Techniques Implemented:**
- **Scoped CSS Selectors:** All styles prefixed with `.collabrio-app` to prevent global conflicts
- **CSS Reset with `all: initial`:** Resets inherited styles from host page
- **Important Declarations:** Critical styles use `!important` to override host page styles
- **Box Model Isolation:** Consistent `box-sizing: border-box` throughout
- **Z-index Management:** Proper stacking context with `z-index: 1000`
- **Typography Reset:** Prevents inheritance of host page fonts and text styles
- **Border and Outline Reset:** Ensures clean visual boundaries

**Features Implemented:**
- **Automated CSS Scoping:** Python script to automatically scope all CSS selectors
- **JSX Component Wrapping:** Updated React components with `.collabrio-app` wrapper
- **Embedding Documentation:** Comprehensive guide for integrating in external sites
- **CSS Isolation Test Page:** HTML test file with aggressive host styles to verify isolation
- **Multiple Embedding Methods:** Support for iframe, direct embed, and custom container integration

**Files Created/Modified:**
- `client/src/App.css` - All selectors scoped under `.collabrio-app`
- `client/src/App.jsx` - Added `.collabrio-app` wrapper div to component tree
- `update_css_isolation.py` - Automated CSS scoping script
- `EMBEDDING_GUIDE.md` - Complete embedding documentation
- `embedding-test.html` - CSS isolation test page with aggressive host styles

**Isolation Guarantees:**
- ✅ **No Global CSS Pollution:** All styles contained within `.collabrio-app` scope
- ✅ **Host Page Protection:** Collabrio styles won't affect host page elements
- ✅ **Style Inheritance Prevention:** `all: initial` resets inherited host styles
- ✅ **Framework Compatibility:** Tested compatibility with Bootstrap, Tailwind, Material-UI
- ✅ **Responsive Container:** Adapts to host page layout constraints
- ✅ **Event Isolation:** JavaScript events contained within app boundary

**Testing Results:**
- ✅ Verified isolation with aggressive host page CSS overrides
- ✅ Confirmed functionality with various CSS frameworks
- ✅ Validated responsive behavior in different container sizes
- ✅ Tested iframe and direct embedding methods

**Follow-up Actions:**
- [x] Scope all CSS selectors under `.collabrio-app` namespace (Dev Team - 2025-10-08)
- [x] Update React components with isolation wrapper (Dev Team - 2025-10-08)
- [x] Create automated CSS scoping script (Dev Team - 2025-10-08)
- [x] Write comprehensive embedding documentation (Dev Team - 2025-10-08)
- [x] Create CSS isolation test page (Dev Team - 2025-10-08)
- [x] Implement CSS reset and important declarations (Dev Team - 2025-10-08)
- [ ] Test embedding with real client websites (Dev Team - TBD)
- [ ] Create iframe embedding option (Dev Team - TBD)
- [ ] Add CSP (Content Security Policy) guidelines (Dev Team - TBD)  

---

### Simplified Session ID Generation
**Date:** 2025-10-08  
**Description:** Simplified session ID generation from long UUID-like strings to short 6-character alphanumeric codes  
**Rationale:** The original session IDs were 26+ character long concatenated random strings that were difficult for users to read, share, and remember. Since the application doesn't expect many concurrent sessions, the collision risk is very low with shorter IDs, making them much more user-friendly for sharing and manual entry  
**Status:** Implemented  
**Impact:** Medium - Improves user experience for session sharing and joining  
**Stakeholders:** Development team, end users sharing sessions  
**Implementation:** Changed `generateSessionId()` from `Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)` to `Math.random().toString(36).substring(2, 8)` generating 6-character base36 codes  

**Technical Details:**
- **Original Format:** 26-character string (e.g., `abc123def456ghi789jkl012mno`)
- **New Format:** 6-character base36 string (e.g., `abc123`)
- **Character Set:** 0-9, a-z (36 possible characters per position)
- **Total Possible IDs:** 36^6 = 2,176,782,336 combinations
- **Collision Probability:** Extremely low for expected usage patterns

**Benefits:**
- **User-Friendly:** Easy to read, type, and share verbally
- **URL-Friendly:** Base36 characters are safe in URLs without encoding
- **QR Code Efficient:** Shorter URLs generate simpler QR codes
- **Manual Entry:** Feasible for users to type session IDs manually
- **Memory-Friendly:** Users can remember session IDs temporarily

**Follow-up Actions:**
- [x] Update session ID generation function (Dev Team - 2025-10-08)
- [x] Test build process with new session IDs (Dev Team - 2025-10-08)
- [x] Document decision in memory document (Dev Team - 2025-10-08)
- [ ] Test collision handling in production environment (Dev Team - TBD)
- [ ] Monitor session ID collision rates in production (Dev Team - TBD)

---

### Document State Persistence for New Session Joiners
**Date:** 2025-10-08  
**Description:** Implemented server-side document state storage so new users joining existing sessions immediately see the current document content instead of starting with a blank editor  
**Rationale:** Users joining collaborative sessions with existing content were starting with blank editors and could only see content when new changes were made. This created a poor user experience and made it unclear what was being collaborated on  
**Status:** Implemented and Tested  
**Impact:** High - Significantly improves collaborative user experience and session joining workflow  
**Stakeholders:** Development team, end users joining collaborative sessions  
**Implementation:** Added server-side document storage with automatic synchronization to new session joiners and cleanup when sessions end  

**Technical Implementation:**
- **Document Storage:** Added `sessionDocuments` Map to store current document content per session
- **New Joiner Sync:** Modified `join-session` handler to send current document to new clients
- **State Management:** Updated `document-change` handler to store document updates server-side
- **Memory Cleanup:** Added document cleanup when sessions become empty or inactive
- **Event Enhancement:** Added `isInitialLoad` flag to distinguish initial sync from live updates

**Features Added:**
- **Immediate Content Access:** New users see current document content upon joining
- **Persistent Session State:** Document content preserved while session is active
- **Automatic Cleanup:** Document storage cleaned up when sessions end
- **Seamless Experience:** No visible difference between initial load and live updates
- **Memory Management:** Prevents memory leaks from abandoned sessions

**Server Changes Made:**
- Added `sessionDocuments` Map for document storage
- Enhanced `join-session` event to include document synchronization
- Updated `document-change` event to persist document state
- Added cleanup in disconnect, leave-session, and periodic cleanup handlers
- Added logging for document storage operations

**Testing Results:**
- ✅ New users joining sessions with existing content see document immediately
- ✅ Document content persists while users are active in session
- ✅ Document storage cleaned up when all users leave session
- ✅ No memory leaks from inactive sessions
- ✅ Seamless integration with existing collaborative editing features

**Follow-up Actions:**
- [x] Implement server-side document storage (Dev Team - 2025-10-08)
- [x] Update join-session handler to send current document (Dev Team - 2025-10-08)
- [x] Add document persistence to document-change handler (Dev Team - 2025-10-08)
- [x] Implement cleanup for empty sessions (Dev Team - 2025-10-08)
- [x] Test new joiner experience (Dev Team - 2025-10-08)
- [x] Deploy and verify on production server (Dev Team - 2025-10-08)
- [ ] Add optional document persistence to database (Dev Team - TBD)
- [ ] Implement document history/versioning (Dev Team - TBD)

---

**Documentation Enhancements:**
- **Complete API Reference:** Detailed REST endpoint documentation with curl examples
- **File-Based Injection Guide:** Comprehensive guide to filesystem-based message injection
- **WebSocket Events:** Complete reference for client-server communication
- **Production Deployment:** PM2 and manual deployment instructions
- **Integration Examples:** Frontend integration and environment configuration
- **Error Handling:** Example responses for success and error scenarios

**Configuration Updates:**
- **Vite Configuration:** Optimized build settings and development server configuration
- **Dependency Management:** Updated yarn.lock with new file-watching dependencies
- **Environment Variables:** Documented configuration options and defaults

**Follow-up Actions:**
- [x] Update README with API documentation (Dev Team - 2025-10-05)
- [x] Add file injection documentation (Dev Team - 2025-10-05)
- [x] Document WebSocket events (Dev Team - 2025-10-05)
- [x] Add deployment instructions (Dev Team - 2025-10-05)
- [x] Update Vite configuration (Dev Team - 2025-10-05)
- [ ] Add API documentation website (Dev Team - TBD)
- [ ] Create video tutorials (Dev Team - TBD)

---

### Frontend Core Features Implementation
**Date:** 2025-10-04  
**Description:** Implemented React frontend with collaborative text editor, WebSocket communication, QR code sharing, and session management  
**Rationale:** Building foundation features first allows for iterative development and early testing of core functionality  
**Status:** Implemented  
**Impact:** High - Core application functionality now working  
**Stakeholders:** Development team, end users  
**Implementation:** Created React components with Socket.IO client, QR code modal, real-time document sync, and responsive UI  

**Features Implemented:**
- **Session Management:** URL hash-based anonymous sessions
- **Real-time Editing:** Live document synchronization via WebSocket
- **QR Code Sharing:** Modal with QR code and link copying
- **Connection Status:** Visual indicators for connection state
- **Responsive Design:** Mobile-friendly interface

**Follow-up Actions:**
- [x] Install socket.io-client and QR dependencies (Dev Team - 2025-10-04)
- [x] Create collaborative text editor component (Dev Team - 2025-10-04)
- [x] Implement WebSocket connection management (Dev Team - 2025-10-04)
- [x] Add QR code sharing functionality (Dev Team - 2025-10-04)
- [x] Style responsive UI (Dev Team - 2025-10-04)
- [x] Start development server (Dev Team - 2025-10-04)
- [x] Extend socket server with document collaboration (Dev Team - 2025-10-04)
- [x] Debug session synchronization issue (Dev Team - 2025-10-04)
- [x] Add session joining functionality (Dev Team - 2025-10-04) 
- [x] Test multi-user collaboration (Dev Team - 2025-10-04)
- [x] Verify real-time text synchronization (Dev Team - 2025-10-04)
- [ ] Add WebRTC peer-to-peer connection (Dev Team - TBD)
- [ ] Implement file sharing (Dev Team - TBD)
- [ ] Add document persistence (Dev Team - TBD)

---

## 📚 Glossary

**WebRTC:** Web Real-Time Communication - Browser API enabling direct peer-to-peer communication for audio, video, and data  
**WebSocket:** Protocol providing full-duplex communication channels over a single TCP connection  
**Session Hash:** URL fragment used to identify and join collaborative sessions anonymously  
**Fallback Connection:** Secondary connection method (WebSocket) used when primary method (WebRTC) fails  
**Collaborative Text Editor:** Real-time shared document editing where changes from one user appear instantly for all participants  
**File Sharing:** Feature allowing participants to share files directly within the session  
**QR Code Sharing:** Method to share session URLs via QR code for easy mobile device access  
**Socket.IO:** JavaScript library enabling real-time bidirectional event-based communication between client and server  
**Vite:** Fast build tool and development server for modern web projects  
**Session Management:** System for maintaining user sessions without authentication using URL fragments  
**Real-time Sync:** Instant propagation of document changes across all connected clients  
**Responsive UI:** Interface that adapts to different screen sizes and devices  
**Session Isolation:** Security feature ensuring users in different sessions cannot see each other's content  
**Hot Module Replacement (HMR):** Development feature allowing code changes to update immediately without page refresh  
**Document State Management:** React state handling for collaborative text content synchronization  
**Multi-client Testing:** Process of verifying functionality across multiple browser instances simultaneously  
**Session Hash:** URL fragment identifier used for anonymous session management (#sessionId)  
**File-Based Injection:** Automated system for injecting messages into sessions by creating/modifying text files in a watched directory  
**Chokidar:** Node.js file system watcher library used for monitoring changes to message files  
**Message File Archival:** System for moving processed message files to timestamped archive directory to prevent reprocessing  
**File Watcher:** Automated monitoring system that detects file changes and triggers message injection workflow  
**Session Validation:** Process of verifying that a session exists and has active clients before processing message injection  
**Message Type Parsing:** Extraction of message type from filename patterns (e.g., `sessionId_type.txt`)  
**Processed Directory:** Archive folder where successfully processed message files are moved with timestamps  
**REST API Injection:** HTTP POST endpoint for programmatically injecting messages into collaborative sessions  
**Automation Integration:** Capability for external systems to send messages via file drops or API calls  

*Add all important terms, acronyms, and concepts that team members should understand*

## 🤝 Meeting Notes

### [Meeting Title]
**Date:** [YYYY-MM-DD]  
**Attendees:** [List of attendees]  
**Agenda:**
- [Agenda item 1]
- [Agenda item 2]
- [Agenda item 3]

**Notes:** 
[Main discussion points, decisions made, important information shared]

**Action Items:**
- [x] [Completed task] ([Assignee] - [Date])
- [ ] [Pending task] ([Assignee] - [Date])
- [ ] [Future task] ([Assignee] - [Date])

---

*Add more meetings using the same format above*

## 💡 Lessons Learned

### [Lesson Title]
**Date:** [YYYY-MM-DD]  
**Category:** [e.g., Technical, User Experience, Project Management, Team Dynamics]  
**Situation:** [What happened - context and circumstances]  
**Lesson:** [What was learned from this situation]  
**Application:** [How this lesson was applied or should be applied in the future]  
**Impact:** [High | Medium | Low] - [How this lesson affected the project or team]  

---

## 💡 Lessons Learned

### Session Management Debugging
**Date:** 2025-10-04  
**Category:** Technical  
**Situation:** Multi-user collaboration wasn't working because each browser tab was generating its own unique session ID, putting users in different sessions instead of the same collaborative session  
**Lesson:** Always verify that multiple clients are connecting to the same session when testing collaborative features. Session isolation can make it appear that real-time sync is broken when it's actually working correctly within each session  
**Application:** Added session input field for manual session joining, improved debugging with server logs showing session IDs, and documented the need to share complete URLs (including hash fragments) for collaboration  
**Impact:** High - Critical for multi-user functionality testing and user experience  

---

### Spec-Driven Development Process
**Date:** 2025-10-04  
**Category:** Project Management  
**Situation:** First time implementing spec-driven development approach with living documentation  
**Lesson:** Keep specifications detailed with acceptance criteria, update both spec and memory docs continuously, and use user stories to drive feature development rather than technical tasks  
**Application:** Enhanced spec document with acceptance criteria, added testing validation section, improved traceability between requirements and implementation  
**Impact:** Medium - Improves development process and quality assurance  

---

### File-Based System Integration Design
**Date:** 2025-10-05  
**Category:** Technical Architecture  
**Situation:** Needed to enable external automation and scripts to inject messages into collaborative sessions without requiring direct API integration or authentication  
**Lesson:** File-based interfaces provide excellent integration points for external systems. Using filesystem watching with automatic file processing creates a simple, reliable integration method that works across different platforms and programming languages  
**Application:** Implemented chokidar file watcher to monitor a messages directory, parse session ID and message type from filenames, inject content into active sessions, and archive processed files. This enables any system that can write files to integrate with the collaboration platform  
**Impact:** High - Opens significant automation possibilities and simplifies integration with external tools, scripts, and monitoring systems  

---

### Documentation-Driven Feature Implementation
**Date:** 2025-10-05  
**Category:** Project Management  
**Situation:** Implemented comprehensive file-based injection system and enhanced REST API while maintaining detailed documentation throughout development  
**Lesson:** Documenting features thoroughly during implementation (not after) leads to better API design, clearer error handling, and easier testing. Writing examples and use cases forces you to think through edge cases and user experience  
**Application:** Created complete README documentation with curl examples, error scenarios, and integration guides while implementing the features. This led to better parameter validation, clearer error messages, and more robust functionality  
**Impact:** Medium - Improves code quality, reduces support burden, and accelerates adoption by making features self-documenting  

---

*Add more lessons using the same format above*

## 👥 Onboarding Notes

### [New Team Member Name] - [Role]
**Status:** [Active | Complete | On Hold]  
**Department:** [Department/Team]  
**Start Date:** [YYYY-MM-DD]  
**Mentor:** [Mentor name]  

**Technical Setup:**
- [ ] Development environment setup
- [ ] Repository access and permissions
- [ ] Required tools and software installation
- [ ] Understanding of build and deployment process

**Codebase Familiarity:**
- [ ] Project architecture overview
- [ ] Code style and conventions
- [ ] Key components and modules
- [ ] Testing practices and frameworks

**Feature Implementation:**
- [ ] First small bug fix or feature
- [ ] Code review participation
- [ ] Independent feature development
- [ ] Mentoring other team members

**Resources:**
- 📚 [Link to documentation]
- 📚 [Link to coding standards]
- 📚 [Link to project wiki]
- 📚 [Link to team processes]

**Notes:**
[Progress observations, strengths, areas for improvement, next steps]

**Next Goals:**
- [ ] [Specific goal 1]
- [ ] [Specific goal 2]
- [ ] [Specific goal 3]

**Completion Status:** [Percentage]% - [Brief status description]

---

## 🔄 Development Workflow

### Current Process
1. **Spec-First:** Define user stories with acceptance criteria before coding
2. **Implementation:** Build features to meet specific acceptance criteria  
3. **Testing:** Validate against acceptance tests in spec document
4. **Documentation:** Update both spec status and memory decisions
5. **Review:** Ensure requirements are met before moving to next feature

### Quality Gates
- **Feature Complete:** All acceptance criteria met
- **Tested:** Manual testing completed and documented
- **Documented:** Spec and memory docs updated
- **Committed:** Code changes committed with clear messages

### Next Feature Development
1. **Choose user story** from spec document backlog
2. **Review acceptance criteria** and ensure they're testable
3. **Plan implementation** and document major decisions
4. **Build incrementally** with frequent testing
5. **Update documentation** as you learn and discover issues

---

*This memory document should be updated whenever significant decisions are made, lessons are learned, or team changes occur. It serves as both historical record and guidance for future development.*

---

## 🤖 AI Agent Instructions

When updating this memory document, please:

1. **Add new decisions** to the Decision Log with proper rationale and implementation details
2. **Update existing decisions** if their status changes (e.g., from Decided to Implemented)
3. **Add lessons learned** from recent project experiences, focusing on actionable insights
4. **Update meeting notes** with recent team meetings, decisions, and action items
5. **Maintain the glossary** by adding new terms and updating existing definitions
6. **Update onboarding notes** as team members progress or new members join
7. **Preserve the exact format** including emojis, sections, and field names for compatibility with Arcana
8. **Use the action item format**: `- [x] Task description (Assignee - Date)` for completed items
9. **Use the action item format**: `- [ ] Task description (Assignee - Date)` for pending items
10. **Keep the document current** by updating the "Last Updated" date at the top

**Format Requirements for Arcana Compatibility:**
- Section headers must use exact emoji format: `## 🏢 Project Information`
- Action items must follow format: `- [x] Description (Person - Date)`
- All field names like **Date:**, **Status:**, **Impact:** must be preserved exactly
- Maintain consistent indentation and bullet point formatting