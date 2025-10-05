# Clippy the webRTC chat with file sharing

*Technical Specification Document*
*Generated on October 4, 2025*

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

#### Network Resilience  
- 📖 **As a user**, when WebRTC is blocked (e.g., on mobile networks), I want to fallback to WebSocket communication
  - **Acceptance Criteria:**
    - ✅ WebSocket connection established as primary method
    - 🔄 WebRTC P2P connection (planned enhancement)
    - 🔄 Automatic fallback detection (planned)

#### File Sharing (Planned)
- 📖 **As a user**, I want to drag and drop files to share them with other session participants
  - **Acceptance Criteria:**
    - 🔄 Drag-and-drop interface
    - 🔄 File transfer via WebRTC or WebSocket
    - 🔄 File download for recipients

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

we will be using a client with react and for the back-end a socket server that runs on socket.impressto.ca. The socket server uses nodejs


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
  - ✅ **PASSED** - Link copying works
  - 🔄 **PENDING** - Mobile device QR scanning test
- [ ] **Test Case 4:** Responsive design
  - ✅ **PASSED** - Desktop browser compatibility
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
