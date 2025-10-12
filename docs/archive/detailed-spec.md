# Collabrio - Real-time Collaborative Text Editor
## Technical Specification Document

**Project Name:** Collabrio  
**Version:** 2.2  
**Last Updated:** October 11, 2025  
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

### Epic 1: Security & Access Control
**Goal:** Restrict access to authorized school users only

#### US-010: School Registration Authentication
**As an administrator**, I want to restrict access to students from authorized schools only so that the platform remains secure and compliant.

**Acceptance Criteria:**
- [x] Users must enter valid school registration number before accessing any features
- [x] Only two specific school numbers are accepted: 906484 (Earl of March) and 894362 (Bell High School)
- [x] School number is validated with server-side endpoint `/validate-school`
- [x] Valid school authentication is stored in localStorage to prevent re-entry
- [x] Invalid school numbers show clear error message with teacher contact suggestion
- [x] Socket connections require valid school authentication to join sessions
- [x] Authentication failures disconnect users and clear stored credentials
- [x] School authentication modal appears before identity setup for all entry points
- [x] URL-based session joining properly validates school authentication first
- [x] No school hints or valid numbers displayed in UI (security requirement)

**Technical Notes:**
- Server-side validation prevents client-side bypassing
- School numbers and names configured via environment variables (VALID_SCHOOL_NUMBERS, SCHOOL_NAMES)
- localStorage persistence improves user experience for returning students
- Socket-level validation ensures no unauthorized session access
- All entry points (create, join, URL hash) validate school authentication
- schoolUtils.js provides centralized school number/name mapping functionality
- Clear error handling guides users to proper authentication channels without revealing valid options

**Security Considerations:**
- School numbers treated as shared secrets for institution-level access
- Server logs all authentication attempts for monitoring
- Failed authentication attempts disconnect socket and clear credentials
- No fallback or bypass mechanisms - authentication is mandatory
- UI deliberately hides valid school numbers and names from unauthorized users
- Error messages provide no hints about valid registration numbers
- Authentication modal contains no "Available Schools" or number lists

**Definition of Done:**
- Only students with valid school registration numbers can create/join sessions
- Invalid attempts are logged and blocked at multiple levels
- User experience is smooth for authorized users (one-time authentication)
- Clear error messages guide unauthorized users to proper channels

---

#### US-011: School Name Display in Session
**As a user**, I want to see which schools are represented in my collaborative session so that I know who I'm collaborating with.

**Acceptance Criteria:**
- [x] Header displays school names instead of generic "Users:" label
- [x] Single school sessions show: "Earl of March Secondary School: [user list]"
- [x] Multi-school sessions show: "Bell High School and Earl of March Secondary School: [user list]"
- [x] School names are displayed without registration numbers (clean display)
- [x] School names update dynamically as users join/leave sessions
- [x] Fallback to "Users:" when no school information available

**Technical Notes:**
- Server includes schoolNumber in user objects for school identification
- Client aggregates unique school numbers from session participants
- schoolUtils.js maps school numbers to friendly names via environment variables
- Names sorted alphabetically and joined with "and" for multi-school display
- Real-time updates via existing user join/leave socket events

**Security Considerations:**
- School names only displayed to authenticated users within sessions
- No school information leaked to unauthorized users
- School mapping data loaded from secure environment configuration

**Definition of Done:**
- School names display correctly for single and multi-school sessions
- Dynamic updates verified as users join/leave
- Clean, professional display without registration numbers
- Fallback handling working for edge cases

---

#### US-012: Button Cooldown System
**As a system administrator**, I want to prevent users from overwhelming the server by rapidly clicking AI and Random buttons so that the platform remains stable and performant.

**Acceptance Criteria:**
- [x] "Ask AI" button has 15-second cooldown after each click
- [x] "Random" icebreaker button has 15-second cooldown after each click  
- [x] Buttons show countdown timer during cooldown: "Ask AI (14s)", "Random (13s)", etc.
- [x] Buttons become visually disabled (grayed out) during cooldown
- [x] Tooltip shows "Please wait X seconds" during cooldown period
- [x] Users cannot trigger actions during cooldown period
- [x] Cooldown timers are independent for each button
- [x] Visual feedback works in both light and dark themes

**Technical Notes:**
- Client-side state management with useState for cooldown tracking
- Individual setInterval timers for each button's countdown
- CSS disabled states with opacity and cursor changes
- Proper cleanup of timers on component unmount to prevent memory leaks
- Button text dynamically updates to show remaining cooldown seconds

**Security Considerations:**
- Prevents abuse of AI API endpoints that have usage costs
- Reduces server load from rapid-fire requests
- Client-side enforcement sufficient as server has its own rate limiting

**Definition of Done:**
- Cooldown system prevents rapid button clicking
- Visual feedback clearly indicates when buttons will be available again
- No memory leaks from timer management
- Consistent behavior across light and dark themes

---

#### US-013: Document Character Limit System
**As a system administrator**, I want to limit document size to prevent server crashes and ensure performance so that all users have a stable experience.

**Acceptance Criteria:**
- [x] Document content limited to 5,000 characters maximum
- [x] Real-time character counter displays current usage: "1,234 / 5,000 characters"
- [x] Character counter appears in bottom-right corner of text area
- [x] Counter shows warning state at 90% of limit (yellow background)
- [x] Counter shows error state at 100% of limit (red background with pulsing)
- [x] Users cannot type new characters when at the limit
- [x] Large paste operations are intelligently truncated to fit available space
- [x] Users get toast notifications when paste is truncated or limit reached
- [x] Server-side validation rejects documents exceeding the limit
- [x] Limit applies to both Live editor and Draft editor modes
- [x] Character count includes all characters (spaces, newlines, punctuation)

**Technical Notes:**
- Client-side prevention using onKeyPress and onPaste handlers
- Server-side validation with MAX_DOCUMENT_CHARS environment variable
- Smart paste truncation preserves as much content as possible within limits
- Character counter uses absolute positioning relative to editor container
- Real-time updates on every keystroke and content change
- Toast notifications provide clear feedback about limit enforcement

**Performance Considerations:**
- 5,000 character limit chosen to balance usability with server stability
- Prevents memory exhaustion from extremely large documents
- Reduces network traffic for document synchronization
- Improves rendering performance for all users

**Definition of Done:**
- Character limits enforced on both client and server
- Visual feedback clearly shows usage and remaining capacity
- Paste truncation works smoothly without breaking user workflow

---

#### US-014: Username Mention System
**As a user**, I want to quickly mention other users in the document by clicking their avatar so that I can reference collaborators efficiently while writing.

**Acceptance Criteria:**
- [x] Clicking another user's avatar inserts "@username " at current cursor position
- [x] Only other users' avatars are clickable (not your own)
- [x] Clickable avatars show visual hover feedback (teal highlight)
- [x] Tooltip indicates the action: "Click to mention" vs "You"
- [x] Username insertion works in both Live editor and Draft editor modes
- [x] Cursor automatically positions after the inserted mention
- [x] Character limit validation applies to inserted usernames
- [x] Focus returns to the editor after username insertion
- [x] Consistent behavior across light and dark themes

**Technical Notes:**
- insertTextAtCursor function handles cursor position and content updates
- Character limit validation prevents insertion if it would exceed limits
- Uses setTimeout to ensure proper cursor positioning after content update
- Prop threading: App → Header → UserList for callback function
- CSS classes distinguish clickable vs non-clickable user items

**User Experience:**
- Reduces typing effort for mentioning collaborators
- Visual feedback makes the feature discoverable
- Seamless integration with existing editor functionality
- Respects document size limits and current editor mode

**Definition of Done:**
- Username mentions insert smoothly at cursor position
- Visual feedback clearly indicates clickable vs non-clickable users
- Feature works consistently across both editor modes
- Character limit integration prevents document overflow
- Counter positioned cleanly within editor interface
- Both Live and Draft modes respect the character limits

---

#### US-015: Shared Audio System
**As a student**, I want to play fun sound effects that all session participants can hear so that I can add acoustic elements and make the collaborative environment more engaging.

**Acceptance Criteria:**
- [x] Audio popup selector appears in toolbar with visual grid interface
- [x] Grid contains 25+ preloaded sound effects with emoji icons and descriptive names
- [x] Selecting a sound plays it locally and broadcasts to all session participants
- [x] Visual feedback provided through floating icon animations (toasts removed to reduce clutter)
- [x] Audio selector is disabled when not connected to session
- [x] All audio files are preloaded using existing audioManager system
- [x] Multi-column responsive grid layout for easy sound selection
- [x] Dark theme compatible styling for the audio popup
- [x] Server broadcasts audio events to all session participants except sender
- [x] Audio plays through existing audioManager for consistent volume control

**Audio Selection Interface:**
- **🔊 React Button**: Opens popup with multi-column grid of available sounds
- **Visual Grid Layout**: Auto-fill columns with minimum 120px width, responsive design
- **Emoji + Name Display**: Each option shows distinctive emoji and descriptive name
- **Hover Effects**: Interactive buttons with lift animation and color changes
- **Backdrop Interaction**: Click outside popup or X button to close
- **Mobile Responsive**: Grid adapts to smaller screens (100px minimum, 3-4 columns)

**Sound Categories Available:**
- 25+ curated sound effects including memes, gaming references, and reaction sounds
- Examples: Metal Pipe Fall, Bruh, Evil Laugh, Burp, FNAF, Explosion, etc.
- Each sound has distinctive emoji identifier and user-friendly name

**Technical Implementation:**
- AudioSelectorPopup component with grid-based layout and glassmorphism design
- SharedAudioManager utility class handles audio logic (extracted from App.jsx)
- Audio files stored in client/public/audio/ directory with centralized configuration
- Socket event 'play-audio' broadcasts to session participants (excluding sender)
- Floating icon animations replace toast notifications for cleaner UX
- Responsive CSS Grid with auto-fill columns and mobile breakpoints

**User Experience:**
- Visual grid interface much more intuitive than dropdown selector
- Students can see all available sounds at once for faster selection
- Floating icon animations provide clear, non-intrusive feedback
- Mobile-friendly touch targets and responsive design
- Consistent with modern app interface patterns

**Definition of Done:**
- All audio files preload successfully on application start
- Sound selection broadcasts to all session participants
- Audio playback works consistently across browsers
- Visual feedback clearly communicates audio events to users
- Feature integrates smoothly with existing toolbar design

---

#### US-016: Floating Audio Icon Animations
**As a student**, I want to see visual animations showing who played which sound so that I can easily identify sound triggers and enjoy enhanced visual feedback during collaborative sessions.

**Acceptance Criteria:**
- [x] Floating icons appear from random positions at the bottom of the screen
- [x] Icons display the sound's emoji and the username of who triggered it
- [x] Animation smoothly floats upward 300px over 3 seconds with fade-out effect
- [x] Icons appear for both local user (when they play) and remote users (when others play)
- [x] Random horizontal positioning between 10% and 90% of screen width
- [x] High z-index ensures icons appear above all content including modals
- [x] Automatic cleanup removes icons when animation completes
- [x] Glassmorphism design with backdrop blur and theme-aware styling
- [x] Works on both landing page and collaborative editor views
- [x] Each icon has unique ID to prevent conflicts with multiple simultaneous animations

**Visual Design:**
- **Container**: Glassmorphism effect with backdrop blur and rounded corners
- **Content**: Sound emoji (1.5rem) above username (0.75rem, bold)
- **Animation**: Smooth easing with 300px upward movement and opacity fade
- **Positioning**: Random horizontal placement, fixed bottom start position
- **Themes**: Light mode (white background, blue border) and dark mode (dark background, light blue border)

**Technical Implementation:**
- FloatingIcon React component with requestAnimationFrame animation
- ID-based deduplication system prevents duplicate animations per user+sound combination
- Early termination when opacity reaches 0 for optimal performance
- State management via floatingIcons array and activeAnimationIds tracking Map
- Emoji mapping system matching audio popup selections
- Self-cleaning component removes itself via onComplete callback with automatic tracking cleanup

**Performance Considerations:**
- Uses requestAnimationFrame for smooth 60fps animation
- Early animation termination prevents unnecessary calculations on invisible icons
- ID-based tracking system eliminates duplicate icon creation race conditions
- Automatic cleanup prevents memory leaks from accumulated components
- Minimal DOM impact with efficient component lifecycle and precise deduplication

**User Experience:**
- Immediate visual feedback identifies sound initiators
- Adds playful, engaging element to collaborative sessions
- Clear attribution helps maintain classroom awareness
- Non-intrusive positioning doesn't obstruct main content

**Recent Improvements (October 2025):**
- **Duplicate Icon Bug Fix**: Resolved issue where floating icons appeared twice due to race conditions
- **Early Animation Termination**: Icons now stop animating when opacity reaches 0 instead of full duration
- **ID-based Deduplication**: Composite key tracking (username+audioKey) prevents duplicate animations
- **Performance Optimization**: Eliminated "zombie" animation calculations on invisible icons
- **Toast Notification Cleanup**: Removed redundant success toasts since floating icons provide visual feedback

**Definition of Done:**
- Floating animations trigger for all shared audio events without duplicates
- Visual design matches application theme and quality standards
- Performance remains smooth with multiple simultaneous animations
- Feature works consistently across both application views
- No memory leaks, orphaned components, or duplicate icon issues

---

### Epic 2: Session Management
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

#### US-009: Session Document Persistence
**As a user**, I want session documents to be preserved when all users leave so I can return later and continue working.

**Acceptance Criteria:**
- [x] Documents are automatically saved to database when last user leaves session
- [x] Users rejoining empty sessions see previously saved document content
- [x] Documents are auto-saved periodically during active editing (5-second debounce)
- [x] Database cleanup removes sessions older than 30 days
- [x] Empty documents (whitespace only) are not persisted to save storage
- [x] Document loading is seamless - no special UI needed for restored content

**Technical Notes:**
- SQLite database stores session documents with timestamps
- Debounced auto-save prevents excessive database writes during active editing
- Document restoration happens automatically during session join process
- Database cleanup runs on server startup and every 24 hours
- Sessions remain in memory during active use for performance

**Definition of Done:**
- Users can leave and rejoin sessions without losing document content
- Database performance tested with multiple concurrent sessions
- Cleanup process verified to prevent unbounded storage growth
- Auto-save functionality confirmed during active collaboration

---

### Epic 3: Real-time Collaboration  
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

### Epic 4: User Experience
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

#### US-008: Random Icebreaker Generator
**As a user**, I want to generate AI-powered icebreaker statements on random topics to silently inject content into the document as if another participant had typed it.

**Acceptance Criteria:**
- [x] "Random" button accessible in toolbar alongside other action buttons
- [x] Clicking button selects random topic from predefined frontend array
- [x] AI prompt constructed: "Generate a short, random, and humorous statement related to [TOPIC] that can be used to break the ice in a quiet meeting."
- [x] Prompt sent to socket-server using new `ask-ai-direct` event (separate from chat AI)
- [x] AI-generated response silently injected into shared document for all participants
- [x] Topics cover diverse, meeting-appropriate subjects (technology, food, travel, hobbies, etc.)
- [x] Button styling consistent with other toolbar buttons
- [x] NO audio feedback or loading notifications - completely silent operation
- [x] Content appears as natural text without special formatting or prefixes

**Technical Notes:**
- Uses NEW `ask-ai-direct` socket event (different from existing "Ask AI" feature)
- Server responds with `ai-response-direct` event containing only the AI response
- Frontend directly injects AI response into document state and broadcasts change
- NO audio feedback, NO toast notifications, NO special formatting
- Content appears as if typed by a user - seamless and natural integration

**Topics Array:**
- **Technology:** "artificial intelligence", "smartphones", "social media", "video games"
- **Food & Drink:** "coffee culture", "unusual food combinations", "cooking disasters", "favorite snacks"
- **Travel:** "dream destinations", "travel mishaps", "local customs", "transportation"
- **Hobbies:** "weekend activities", "childhood collections", "creative pursuits", "sports"
- **Work Life:** "remote work", "meeting etiquette", "office supplies", "productivity tips"
- **Entertainment:** "movies", "music genres", "books", "streaming services"
- **Lifestyle:** "morning routines", "pet stories", "weather preferences", "holiday traditions"

**AI Prompt Template:**
```
"Generate a short, random, and humorous statement related to [RANDOMLY_SELECTED_TOPIC] that can be used to break the ice in a quiet meeting."
```

**Definition of Done:**
- Random button added to toolbar with consistent styling and loading states
- Topic array contains 25+ diverse, appropriate topics
- AI integration working through existing socket-server infrastructure
- Generated icebreakers appear in document for all session participants
- Audio feedback matches existing AI feature behavior
- Button tested across different browsers and themes

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
App.jsx (State Management & Authentication Flow)
├── LandingPage.jsx (Session Creation/Joining)
├── SchoolAuthModal.jsx (School Registration Authentication)
├── IdentityModal.jsx (Username & Avatar Selection)
├── Header.jsx (Branding & School Display)
├── UserList.jsx (Multi-School User Display)
├── Toolbar.jsx (Actions & Controls)
├── Editor.jsx (Collaborative Text Area)
├── ShareModal.jsx (QR Code & Links)
├── Footer.jsx (Educational Branding)
└── Toast.jsx (User Notifications)

Utils:
├── schoolUtils.js (School Number/Name Mapping)
├── identityUtils.js (User Identity Management)
└── icebreakerUtils.js (AI Integration Support)
```

### 3.4 Communication Protocol

#### WebSocket Events
- `join-session`: User joins collaborative session (with school authentication)
- `leave-session`: User leaves session  
- `document-change`: Text content updates
- `user-joined`: New user notification with identity and school information
- `user-left`: User departure notification with updated user list
- `auth-error`: Authentication failure notifications
- `server-text-injection`: Automated message insertion

#### Session Management
- Sessions identified by 6-character alphanumeric codes
- Server maintains active session list with participant tracking
- Document state persisted in SQLite database for session continuity
- User objects include identity (username, avatar) and school authentication
- Automatic cleanup when sessions become empty
- Multi-layer authentication (client, API endpoint, socket validation)

---

## 4. Configuration & Environment

### 4.1 Environment Variables

#### Frontend Configuration
```bash
# Socket server connection
VITE_SOCKET_SERVER_URL=http://localhost:4244

# School Authentication
VITE_VALID_SCHOOL_NUMBERS=9064334,855362
VITE_SCHOOL_NAMES=906484:Earl of March Secondary School,894362:Bell High School

# Application behavior  
VITE_DEBUG=false
VITE_RECONNECTION_ATTEMPTS=5
VITE_SESSION_KEEPALIVE_INTERVAL=30000

# AI Integration (Optional)
VITE_ASK_AI_MAX_CHARS=500
VITE_AUDIO_VOLUME=0.8

# Document Limits
VITE_MAX_DOCUMENT_CHARS=20000
```

#### Backend Configuration
```bash
# Server settings
PORT=4244
NODE_ENV=production

# School Authentication (Security Critical)
VALID_SCHOOL_NUMBERS=906484,894362
SCHOOL_NAMES=906484:Earl of March Secondary School,894362:Bell High School

# AI Integration (Optional)
COHERE_API_KEY=your_api_key_here
COHERE_MODEL=command-r-plus

# Document Limits
MAX_DOCUMENT_CHARS=20000
```

### 4.2 Deployment Architecture
- **Frontend:** Static files served via web server (Apache/Nginx)
- **Backend:** Node.js WebSocket server on separate port
- **Process Management:** PM2 for automatic restarts and monitoring
- **Embedding:** CSS isolation allows safe integration in external sites

---

## 5. Testing Strategy

### 5.1 Functional Testing
- [x] School authentication workflow (valid/invalid numbers)
- [x] Multi-user collaboration (2-5 concurrent users)
- [x] Session creation and joining workflows with authentication
- [x] URL-based session joining with school validation
- [x] Real-time text synchronization accuracy
- [x] School name display in user interface
- [x] QR code generation and mobile scanning
- [x] Theme switching and persistence
- [x] Toast notification system

### 5.2 Technical Testing  
- [x] School authentication server-side validation
- [x] SQLite database session persistence
- [x] WebSocket connection stability with authentication
- [x] Document state persistence across user sessions
- [x] Session cleanup on disconnect
- [x] Multi-layer security validation (client, API, socket)
- [x] Environment variable configuration for school mapping
- [x] CSS isolation for embedding
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