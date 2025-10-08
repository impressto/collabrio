# Collabrio - Real-time Collaborative Text Editor

*Technical Specification Document*  
*Last Updated: October 8, #### File Sha#### File Sharing (Ephemeral)
- 📖 **As a user**, I want to drag and drop a single file to share it with other session participants
  - **Acceptance Criteria:**
    - 🔄 Drag-and-drop interface for single files in collaborative editor area
    - 🔄 Visual feedback during drag operations (highlight drop zone)
    - 🔄 File upload progress indicator for large files
    - 🔄 Single file selection only (no batch uploads)
    - 🔄 File size limits with clear error messages (e.g., 10MB per file)
    - 🔄 File type restrictions with whitelist/blacklist capability
- 📖 **As a user**, I want to click a "Share File" button to select and upload a single file
  - **Acceptance Criteria:**
    - 🔄 File picker button accessible in session toolbar
    - 🔄 Standard file selection dialog (single file only)
    - 🔄 Preview of selected file before upload
    - 🔄 Cancel upload option during file selectionuser**, I want to click a "Share File" button to select and upload a single file
  - **Acceptance Criteria:**
    - 🔄 File picker button accessible in session toolbar
    - 🔄 Standard file selection dialog (single file only)
    - 🔄 Preview of selected file before upload
    - 🔄 Cancel upload option during file selectioneral)
- 📖 **As a user**, I want to drag and drop a single file to share it with other session participants
  - **Acceptance Criteria:**
    - 🔄 Drag-and-drop interface for single files in collaborative editor area
    - 🔄 Visual feedback during drag operations (highlight drop zone)
    - 🔄 File upload progress indicator for large files
    - 🔄 File size limits with clear error messages (e.g., 10MB per file)
    - 🔄 File type restrictions with whitelist/blacklist capability
- 📖 **As a user**, I want to click a "Share File" button to select and upload a single filee Sharing Specification Complete*

---

## 📋 Project Overview

This project enables two or more clients to connect directly using WebRTC and collaborate on a shared text document. When one client edits the text, the changes are instantly reflected in all other clients’ interfaces. Similarly, when a client shares a file, it becomes accessible to all participants in the session.

Additionally, a permanent storage option will allow clients to save their shared text to a server. When users return to the same session, the system can restore the document from the server, reinitializing it with the previously saved content.

### Key Details

**🎯 Purpose:** To allow one or more people to collaborate on a single body of text. 

## ⚙️ Functional Requirements

### User Stories

#### Core Collaboration
- 📖 **As a user**, I want to explicitly create a new session so that I control when collaboration begins
  - **Acceptance Criteria:** 
    - ✅ "Create New Session" button on landing page
    - ✅ Button generates unique session ID and redirects to session
    - ✅ Session ID visible in interface after creation
    - 🔄 Multiple users can join same session via shared URL (needs testing)
- 📖 **As a user**, I want to be unable to access collaborative features without a valid session
  - **Acceptance Criteria:**
    - ✅ Landing page shows session creation interface
    - ✅ No auto-generated sessions on page load
    - ✅ Clear messaging about needing to create or join session
- 📖 **As a user**, I want to leave a session and return to the landing page
  - **Acceptance Criteria:**
    - ✅ "Leave Session" button in collaborative interface
    - ✅ Button disconnects from session and returns to landing page
    - ✅ Session state is cleared when leaving
- 📖 **As a user**, I want to click a "share" button and get a QR code in a modal that I can scan with a phone
  - **Acceptance Criteria:**
    - ✅ Share button opens modal with QR code
    - ✅ QR code contains full session URL
    - ✅ Link is copyable to clipboard
- 📖 **As a user**, I want to type text and see it appear instantly on other users' screens
  - **Acceptance Criteria:**
    - ✅ Real-time text synchronization works
    - ✅ No significant delay between typing and appearing
    - ✅ Cursor position preserved during updates
    - ✅ New users joining sessions see existing document content immediately

#### User Experience Enhancements
- 📖 **As a user**, I want visual feedback when I copy links or document content
  - **Acceptance Criteria:**
    - ✅ Toast notifications appear for copy operations
    - ✅ Toasts automatically disappear after 3 seconds
    - ✅ Toast styling matches app theme (light/dark)
    - ✅ No more intrusive browser alert() dialogs
- 📖 **As a user**, I want to easily copy the document content to my clipboard
  - **Acceptance Criteria:**
    - ✅ Copy icon (⧉) appears in top-right corner of editor
    - ✅ Clicking icon copies all document text
    - ✅ Toast confirmation appears after copying
    - ✅ Icon styling matches app theme
- 📖 **As a user**, I want to switch between light and dark themes for better visual comfort
  - **Acceptance Criteria:**
    - ✅ Theme toggle icon in toolbar (🌙/☀️)
    - ✅ Complete dark theme covering all UI components
    - ✅ Theme preference saved in localStorage
    - ✅ Theme persists across browser sessions
    - ✅ Smooth visual transitions between themes
- 📖 **As a user**, I want a clean, simple interface with organized components
  - **Acceptance Criteria:**
    - ✅ Modular component architecture (LandingPage, Header, Toolbar, Editor, etc.)
    - ✅ Simplified hosting with direct CSS/JS imports
    - ✅ App fills entire viewport with no margins
    - ✅ Consistent branding with logo integration
    - ✅ Reduced toolbar clutter (removed redundant copy button)
- 📖 **As a user**, I want to draft messages offline before sharing them live
  - **Acceptance Criteria:**
    - ✅ Draft mode accessible via tab interface (Live/Draft)
    - ✅ Draft content persists in localStorage across sessions
    - ✅ Visual tabs that look like authentic browser tabs
    - ✅ Floating action buttons for copy and add-to-live operations
    - ✅ Draft content copyable with toast notification
    - ✅ Clear draft button for content reset
    - ✅ Floating icons instead of traditional buttons for modern UI

#### Network Resilience  
- 📖 **As a user**, when WebRTC is blocked (e.g., on mobile networks), I want to fallback to WebSocket communication
  - **Acceptance Criteria:**
    - ✅ WebSocket connection established as primary method
    - 🔄 WebRTC P2P connection (planned enhancement)
    - 🔄 Automatic fallback detection (planned)

#### Server Text Injection (Experimental)
- 📖 **As a system**, I want to inject text messages into collaborative sessions for notifications or bot interactions
  - **Acceptance Criteria:**
    - ✅ Server can send text to be inserted into document
    - ✅ Injected text appears for all clients in session
    - ✅ Clear distinction between user and system text with [TYPE] formatting
    - ✅ REST endpoint `/inject-text` for programmatic injection
- 📖 **As an external system**, I want to inject messages by creating/modifying files that are automatically detected
  - **Acceptance Criteria:**
    - 🔄 Server watches for files named `{sessionId}_{type}.txt`
    - 🔄 File changes trigger automatic text injection
    - 🔄 File content becomes the injected message
    - 🔄 Files are processed and cleaned up after injection
- 📖 **As an admin**, I want to drop text files that automatically inject into sessions based on filename
  - **Acceptance Criteria:**
    - 🔄 Server watches for files named `<sessionId>.txt` or `<sessionId>_<type>.txt`
    - 🔄 File changes trigger automatic text injection into matching session
    - 🔄 File content is injected and file is processed/archived
    - 🔄 Support for different message types via filename patterns

#### File Sharing
- 📖 **As a user**, I want to drag and drop files to share them with other session participants
  - **Acceptance Criteria:**
    - 🔄 Drag-and-drop interface for files in collaborative editor area
    - 🔄 Visual feedback during drag operations (highlight drop zone)
    - � File upload progress indicator for large files
    - 🔄 Support for multiple file selection and batch upload
    - 🔄 File size limits with clear error messages (e.g., 10MB per file)
    - 🔄 File type restrictions with whitelist/blacklist capability
- �📖 **As a user**, I want to click a "Share File" button to select and upload files
  - **Acceptance Criteria:**
    - 🔄 File picker button accessible in session toolbar
    - 🔄 Standard file selection dialog
    - 🔄 Multiple file selection support
    - 🔄 Preview of selected files before upload
    - 🔄 Cancel upload option during file selection
- 📖 **As a user**, I want to receive immediate notifications when someone shares a file
  - **Acceptance Criteria:**
    - 🔄 Toast notification appears when another user shares a file
    - 🔄 Notification shows filename, file size, and sender (if applicable)
    - 🔄 Download and dismiss buttons available in notification
    - 🔄 Notification auto-dismisses after 30 seconds if ignored
    - 🔄 Visual/audio notification options for file sharing events
- 📖 **As a user**, I want to download files shared by other participants immediately
  - **Acceptance Criteria:**
    - 🔄 One-click download directly from notification
    - 🔄 Download progress indicator for large files
    - 🔄 Original filename preservation
    - 🔄 File integrity verification (checksums)
    - 🔄 Automatic file cleanup after download or timeout
- 📖 **As a user**, I understand that file sharing is ephemeral and real-time only
  - **Acceptance Criteria:**
    - 🔄 Clear messaging that files are only available when shared (no persistent storage)
    - 🔄 No file history or list of previously shared files
    - 🔄 Files automatically expire if not downloaded within reasonable time (5 minutes)
    - 🔄 New session joiners do not see previously shared files
    - 🔄 Simple, lightweight file sharing focused on immediate collaboration needs

## 🔧 Technical Requirements for File Sharing (Ephemeral)

### File Upload & Storage
- **File Size Limits:** Maximum 10MB per file (single file only, no batch uploads)
- **File Types:** Support common file types with configurable whitelist/blacklist
  - **Allowed:** Documents (pdf, doc, docx, txt, md), Images (jpg, jpeg, png, gif, svg), Archives (zip, tar, gz), Code (js, py, css, html, json)
  - **Blocked:** Executables (exe, bat, sh, app), System files (dll, sys), Potentially dangerous (scr, vbs, jar)
- **Storage Method:** Minimal temporary server-side storage for active transfers only
- **File Persistence:** Files available only during active transfer (5-minute timeout)
- **Cleanup Policy:** Immediate deletion after download completion or 5-minute timeout

### Upload/Download Protocol
- **Primary Method:** WebSocket-based chunked transfer for broad compatibility
- **Future Enhancement:** WebRTC peer-to-peer for direct file transfer
- **Chunk Size:** 64KB chunks for optimal memory usage and progress tracking
- **Progress Tracking:** Real-time upload/download progress for files >1MB
- **Error Handling:** Simple retry mechanism, no resumable uploads needed
- **Concurrency:** Single file transfer per user (no simultaneous transfers)

### File Metadata Management
- **File Information:** Original filename, size, MIME type, upload timestamp
- **Unique Identifiers:** Simple server-generated file IDs for active transfers
- **Integrity Verification:** Basic checksum validation for transfer accuracy
- **Session Association:** Files tied to specific session IDs for security
- **No Persistence:** No file history, lists, or permanent storage

### Security & Validation
- **File Scanning:** MIME type verification, extension validation
- **Size Validation:** Client and server-side file size limits
- **Rate Limiting:** Maximum 3 file uploads per 5 minutes per user
- **Authentication:** Files accessible only to active session participants
- **Privacy:** No file storage, immediate cleanup ensures complete privacy

### UI/UX Integration
- **No File Panel:** No dedicated files tab or persistent file list
- **Drag & Drop:** Drop zone overlay with visual feedback for immediate sharing
- **Progress Indicators:** Upload/download progress bars with percentage and ETA
- **Notification System:** Enhanced toast notifications with download/dismiss actions
- **Responsive Design:** File notifications work on mobile and desktop
- **Theme Integration:** File notifications support light/dark themes

### WebSocket Events (New)
- **file-share:** Client initiates file sharing with metadata and transfer initiation
- **file-chunk:** Binary chunk transfer events for real-time delivery
- **file-available:** Notification to all session users that a file is ready for download
- **file-download:** Download request from notification recipient
- **file-expired:** Automatic cleanup notification when file times out

### Server-Side Requirements
- **Minimal Storage:** In-memory temporary storage for active transfers only
- **Immediate Cleanup:** Files deleted immediately after download or 5-minute timeout
- **Memory Management:** Streaming transfers to prevent memory buildup
- **Error Logging:** Basic logging for transfer operations and errors
- **Configuration:** Environment variables for file size limits, allowed types, timeout duration

### Features

#### webRTC connection by default

The clients will have a common url, using a hack in the url, to allow them to establish a common connection via WebRTC

- **Priority:** High
- **Status:** Planned (WebSocket foundation complete, ready for WebRTC layer)

#### fallback to the use of webSockets

If webRTC is fully blocked by a mobile network, allow a fallback to using a websocket server at socket.impressto.ca. The source code for the socket server will be part of this project.

- **Priority:** High
- **Status:** ✅ Completed (WebSocket connection working, tested multi-user collaboration)

#### Anonymous usage

All usage will be anonymous. Users will need the specific url and hash to share a session, but otherwise there will be no authentication

- **Priority:** Medium
- **Status:** ✅ Completed (URL hash-based sessions working)

#### QR Code sharing

Users can share sessions via QR code for easy mobile access

- **Priority:** Medium
- **Status:** ✅ Completed (QR modal with shareable links)

#### Real-time collaborative editing

Multiple users can edit the same document simultaneously with live updates

- **Priority:** High
- **Status:** ✅ Completed (Multi-user real-time text synchronization working)

#### Session joining functionality

Users can manually join specific sessions by entering session IDs

- **Priority:** Medium
- **Status:** ✅ Completed (Session input field added for easy collaboration setup)

## 🔧 Technical Requirements

### Architecture Overview

Component-based React frontend with Node.js WebSocket backend. The application uses a modular architecture with isolated components for maintainability and a simplified hosting approach with direct asset imports.

#### Frontend Architecture
- **Component Structure:** Modular React components (LandingPage, Header, Toolbar, Editor, ShareModal, Toast)
- **State Management:** React hooks with localStorage persistence for theme preferences
- **Styling:** CSS isolation with `.collabrio-app` namespace for safe embedding
- **Build System:** Vite with environment variable configuration
- **Hosting:** Simplified PHP wrapper with direct CSS/JS imports

#### Backend Architecture  
- **WebSocket Server:** Node.js with Socket.IO for real-time communication
- **Document Persistence:** Server-side document storage with automatic cleanup
- **Text Injection:** REST API and file-based system for external message injection
- **Session Management:** In-memory session tracking with user count monitoring


### 💻 Technologies

#### Frontend
- React (UI framework)
- Vite (build tool and dev server)
- Yarn (package manager)

#### Backend
- Node.js (runtime)
- Socket.IO (WebSocket communication)
- Express (web server)

### 🏗️ Infrastructure

For now we will be deploying manually

## 🧪 Testing & Validation

### Acceptance Tests

#### Multi-User Collaboration
- [ ] **Test Case 1:** Session creation workflow
  - 🔄 **PENDING** - Landing page shows session creation interface
  - 🔄 **PENDING** - "Create New Session" button generates valid session
  - 🔄 **PENDING** - Users can join session via shared URL
- [ ] **Test Case 2:** Multi-user collaboration
  - 🔄 **PENDING** - Two users in same session can collaborate
  - 🔄 **PENDING** - Real-time text synchronization works
  - 🔄 **PENDING** - User count updates correctly
- [ ] **Test Case 2:** Session isolation
  - ✅ **PASSED** - Different sessions remain separate
  - ✅ **PASSED** - Users cannot see other sessions' content

#### User Interface
- [ ] **Test Case 3:** QR Code sharing
  - ✅ **PASSED** - QR modal opens and displays code
  - ✅ **PASSED** - Link copying works with toast notifications
  - 🔄 **PENDING** - Mobile device QR scanning test
- [ ] **Test Case 4:** Responsive design & Components
  - ✅ **PASSED** - Desktop browser compatibility
  - ✅ **PASSED** - Component-based architecture implemented
  - ✅ **PASSED** - Dark theme toggle with persistence
  - ✅ **PASSED** - Toast notification system
  - ✅ **PASSED** - Document content copy functionality
  - ✅ **PASSED** - Simplified index.php for direct CSS/JS imports
  - 🔄 **PENDING** - Mobile browser testing
  - 🔄 **PENDING** - Tablet testing

#### Network & Performance
- [ ] **Test Case 5:** Connection handling
  - ✅ **PASSED** - WebSocket connection establishment
  - ✅ **PASSED** - Connection status indicators
  - 🔄 **PENDING** - Reconnection on network interruption
- [ ] **Test Case 6:** Performance under load
  - 🔄 **PENDING** - Multiple concurrent users (>5)
  - 🔄 **PENDING** - Large document handling
  - 🔄 **PENDING** - Network latency testing
- [ ] **Test Case 7:** Server text injection
  - ✅ **PASSED** - REST endpoint accepts injection requests
  - ✅ **PASSED** - Text appears in all clients' documents
  - ✅ **PASSED** - Different message types (system, bot, admin)
  - ✅ **PASSED** - Proper formatting with [TYPE] labels

## 🚀 File Sharing Implementation Plan (Ephemeral)

### Phase 1: Basic File Transfer (Week 1)
**Goal:** Single file sharing with immediate notification system
- [ ] **Server-side file handling:** Create temporary upload/download endpoint with 5-minute timeout
- [ ] **Client-side upload UI:** File picker button and drag-and-drop zone (single file only)
- [ ] **WebSocket events:** Implement file-share, file-chunk, file-available events
- [ ] **File validation:** Size limits, type checking, basic security validation
- [ ] **Notification system:** Enhanced toast with download/dismiss buttons

### Phase 2: Real-time Delivery (Week 2)  
**Goal:** Complete the ephemeral sharing workflow
- [ ] **Download system:** Direct download from notification, progress tracking
- [ ] **Real-time notifications:** File available notifications to all active session users
- [ ] **Automatic cleanup:** File deletion after download or 5-minute timeout
- [ ] **Error handling:** Upload/download failure recovery with user feedback
- [ ] **Progress indicators:** Upload and download progress for better UX

### Phase 3: Polish & Integration (Week 3)
**Goal:** Integrate seamlessly with existing UI and ensure reliability
- [ ] **Theme integration:** File notifications work with light/dark themes
- [ ] **Responsive design:** Mobile-friendly file sharing interface
- [ ] **Performance optimization:** Memory management for file transfers
- [ ] **Rate limiting:** Prevent abuse with upload frequency limits
- [ ] **Visual feedback:** Clear drag-and-drop zones and upload states

## 🧪 File Sharing Testing Plan

### Functional Testing
- [ ] **Test Case 1:** Single file upload and download
  - Upload various file types (documents, images, archives)  
  - Verify file integrity with checksum comparison
  - Test progress indicators for large files (>5MB)
  - Confirm notification appears for all session participants
- [ ] **Test Case 2:** Ephemeral file operations
  - Single file uploads by different users (one at a time)
  - File notification and download workflow
  - Automatic file cleanup after download or timeout
  - Real-time notification delivery to all session participants
- [ ] **Test Case 3:** Session behavior
  - New joiners do NOT see previously shared files
  - File timeout after 5 minutes if not downloaded
  - File cleanup after successful download
  - No file persistence across session reconnections

### Error & Edge Case Testing
- [ ] **Test Case 4:** File size and type restrictions  
  - Upload files exceeding size limits (>10MB)
  - Attempt to upload blocked file types
  - Test server response to malformed uploads
  - Verify client-side validation before upload
- [ ] **Test Case 5:** Network interruption handling
  - Upload interruption and resumption
  - Download failure and retry mechanisms
  - WebSocket disconnection during file operations
  - Chunk-level error handling and recovery
- [ ] **Test Case 6:** Concurrent user scenarios
  - Single user upload while others are in session
  - Rate limiting validation (3 uploads per 5 minutes)
  - Session joining during active file transfer
  - Notification delivery to multiple users simultaneously

### Performance & Security Testing  
- [ ] **Test Case 7:** Large file handling
  - Upload/download files near size limit (10MB)
  - Memory usage monitoring during transfers
  - Progress tracking accuracy for large files
  - Server stability with multiple large transfers
- [ ] **Test Case 8:** Security validation
  - Attempt to upload malicious file types
  - Verify file access restrictions between sessions
  - Test file path traversal protection
  - Validate MIME type detection accuracy

### Definition of Done
For each feature to be considered complete:
- [ ] Functional requirements met per acceptance criteria
- [ ] User story acceptance tests pass
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Error handling implemented
- [ ] Documentation updated

---

*Document generated by Arcana • October 4, 2025*
