# Collabrio User Stories & Features

## Active Features

### Core Collaboration Features

#### Real-Time Text Editing
**As a student**, I want to edit text collaboratively so that my group can work together on documents.

**Acceptance Criteria:**
- Multiple users can type simultaneously without conflicts
- Changes appear in real-time for all users (< 100ms latency)
- Cursor positions and selections are synchronized
- Text formatting is preserved across users
- No data loss occurs during concurrent editing

**Current Status:** ✅ Implemented and stable

#### Session Management  
**As a teacher**, I want to create collaborative sessions instantly so that students can join without setup friction.

**Acceptance Criteria:**
- Sessions created automatically with unique URLs
- No registration or login required for basic access
- Sessions persist across browser refreshes
- Multiple independent sessions can run simultaneously
- Session URLs are shareable and immediately functional

**Current Status:** ✅ Implemented and stable

#### QR Code Sharing
**As a teacher**, I want to share session access via QR codes so that students can join quickly from mobile devices.

**Acceptance Criteria:**
- QR code generates automatically for each session
- Mobile devices can scan and join immediately
- QR code includes full session URL
- Works across different mobile browsers
- QR code modal is mobile-friendly

**Current Status:** ✅ Implemented and stable

### User Experience Features

#### Theme Support
**As a user**, I want to choose between light and dark themes so that I can work comfortably in different environments.

**Acceptance Criteria:**
- Theme toggle available in header
- Theme preference persists across sessions
- All components respect current theme
- Smooth transitions between theme changes
- Theme affects all UI elements consistently

**Current Status:** ✅ Implemented and stable

#### User Identity & Avatars
**As a collaborator**, I want to set my username and avatar so that others can identify my contributions.

**Acceptance Criteria:**
- Username can be set through identity modal
- Avatar selection from predefined options
- Identity persists during session
- Username appears in user list
- Identity is optional - anonymous participation allowed

**Current Status:** ✅ Implemented and stable

#### User List Display
**As a collaborator**, I want to see who else is in the session so that I know who I'm working with.

**Acceptance Criteria:**
- Real-time user list shows all active participants
- Displays usernames or "Anonymous User" labels
- Shows user avatars when set
- Updates immediately when users join/leave
- Compact display doesn't interfere with editing

**Current Status:** ✅ Implemented and stable

### File & Media Management Features

#### Image Upload & Sharing
**As a collaborator**, I want to upload and share images instantly so that I can include visual content in our collaborative work.

**Acceptance Criteria:**
- Drag-and-drop or click-to-upload image functionality
- Support for common image formats (PNG, JPG, GIF, WebP)
- Real-time sharing with all session participants
- Thumbnail previews for quick reference
- File size validation and upload progress feedback
- Chunked upload for reliable large file transfer

**Current Status:** ✅ Implemented and stable

#### Image Cache Management
**As a user**, I want to manage cached images so that I can free up server storage and remove unwanted content.

**Acceptance Criteria:**
- Image modal with full-size preview and scrollable content
- Download button for saving images locally
- Delete button for removing images from server cache
- Confirmation dialog before deletion to prevent accidents
- Real-time deletion notifications for all participants
- Cached vs. non-cached status indication

**Current Status:** ✅ Implemented and stable

#### Image Thumbnail Modal
**As a user**, I want to view images in full detail so that I can see shared content clearly.

**Acceptance Criteria:**
- Modal popup with large image preview
- Scrollable content when image is large
- Download and delete actions always accessible
- Mobile-responsive design with touch-friendly controls
- Image metadata display (size, timestamp, uploader)
- Keyboard navigation support (ESC to close)

**Current Status:** ✅ Implemented and stable

### Audio & Engagement Features

#### Interactive Audio Feedback
**As a student**, I want to play sounds and see animations so that collaboration feels engaging and fun.

**Acceptance Criteria:**
- Audio selector popup with grid layout of sound options
- Sounds play for all session participants simultaneously
- Floating emoji animations accompany audio feedback
- Audio works across different browsers and devices
- No duplicate animations occur during rapid interactions

**Current Status:** ✅ Implemented and stable (recent bug fixes applied)

#### Floating Icon Animations
**As a user**, I want visual feedback when sounds are played so that I can see audio activity even with sound off.

**Acceptance Criteria:**
- Animated emoji icons appear when audio is played
- Icons float upward with fade-out animation
- Each audio event creates one icon (no duplicates)
- Animations are smooth and performant
- Icons display username of person who triggered audio

**Current Status:** ✅ Implemented and stable (duplication bug fixed)

### Authentication & Control Features

#### Optional School Authentication  
**As a teacher**, I want to authenticate with my school credentials so that I can access additional features.

**Acceptance Criteria:**
- School selection modal with predefined school codes
- Authentication is completely optional
- Authenticated users get additional capabilities
- Non-authenticated users retain full basic functionality
- Authentication state persists during session

**Supported Schools:**
- Earl of March Secondary School (906484)
- Bell High School (894362)

**Current Status:** ✅ Implemented and stable

### Technical Features

#### Network Resilience
**As a user**, I want the app to work reliably even with network restrictions so that I can collaborate regardless of firewall settings.

**Acceptance Criteria:**
- WebSocket connection attempts first
- Automatic fallback to HTTP long polling if WebSocket blocked
- Graceful handling of connection interruptions  
- Reconnection attempts with exponential backoff
- User feedback when connection issues occur

**Current Status:** ✅ Implemented and stable

#### CSS Isolation for Embedding
**As a developer**, I want to embed Collabrio in other websites so that it can be integrated into existing platforms.

**Acceptance Criteria:**
- All CSS is scoped to prevent conflicts
- Works safely within iframes
- No global CSS pollution
- Maintains functionality when embedded
- Responsive design works in constrained spaces

**Current Status:** ✅ Implemented and stable

## Removed Features (Streamlined for Focus)

### Toast Notifications ❌ REMOVED
Previously displayed redundant notifications for audio events. Removed to reduce visual clutter since floating icons provide sufficient feedback.

### Complex Dropdown Audio Selector ❌ REPLACED  
Replaced with grid-based popup for better mobile experience and visual appeal.

## Feature Testing

### Manual Test Cases

**Session Creation & Joining:**
1. Open app → Verify unique session URL generated
2. Share URL → Verify second user can join immediately  
3. Both users type → Verify real-time synchronization

**Audio System:**
1. Click audio button → Verify grid popup appears
2. Select sound → Verify audio plays for all users
3. Observe floating icon → Verify single animation per event
4. Rapid clicks → Verify no duplicate animations

**Theme & Identity:**
1. Toggle theme → Verify immediate visual change
2. Set username/avatar → Verify appears in user list  
3. Refresh browser → Verify preferences persist

**Image Management:**
1. Upload image → Verify thumbnail appears for all users
2. Click thumbnail → Verify modal opens with full preview
3. Scroll in modal → Verify buttons always accessible
4. Download image → Verify file downloads correctly
5. Delete image → Verify confirmation dialog and real-time removal

**Mobile Experience:**
1. Access on mobile → Verify responsive layout
2. Scan QR code → Verify successful session joining
3. Use touch interactions → Verify all features functional
4. Upload image on mobile → Verify works with camera/gallery

## Known Limitations

- **File Types:** Currently supports images only (no documents, videos, etc.)
- **Text Formatting:** Basic formatting only (no rich text)
- **Session History:** Limited to server restart intervals
- **User Limit:** No enforced limit (performance may degrade with 50+ users)
- **Audio Library:** Fixed set of sounds (not user-customizable)
- **Image Cache:** No automatic cleanup (manual deletion only)

## Future Considerations

*Note: These are not planned features, just potential directions based on user feedback:*

- Rich text formatting (bold, italic, lists)
- File attachment sharing
- Session management dashboard for teachers
- Custom audio upload capability
- Extended school authentication integration