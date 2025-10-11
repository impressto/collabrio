# ADR-0005: Include Username in File-Available Events

## Status
Accepted

## Date
2025-10-11

## Context
The image thumbnail system was displaying "Anonymous User" for all shared images instead of showing the actual usernames. Investigation revealed a reliability issue with username lookup:

**Original Flow (Unreliable):**
1. Server sends `file-available` event with only `uploadedBy: socketId`
2. Client attempts to find username by searching `connectedUsers` array
3. Race conditions occur - `file-available` might arrive before user list updates
4. Fallback to "Anonymous User" even when user has a proper username

**Problems Identified:**
- **Race Condition**: File events could arrive before user list synchronization
- **Client-Side Lookup**: Unreliable dependency on client state synchronization
- **Missing Data**: No server-side username validation or fallback logic
- **Poor UX**: Users see "Anonymous User" instead of their actual display names

## Decision
Enhance the `file-available` socket event to include the uploader's username directly from the server's authoritative user session data.

**Server-Side Enhancement:**
```javascript
// Before: Only socket ID
io.to(sessionId).emit('file-available', {
  uploadedBy: userId,
  // ... other fields
});

// After: Include actual username
const uploaderInfo = activeSessions.get(sessionId)?.get(userId);
const uploaderUsername = uploaderInfo?.username || 'Anonymous User';

io.to(sessionId).emit('file-available', {
  uploadedBy: userId,
  uploaderUsername: uploaderUsername,  // ✅ Direct username inclusion
  // ... other fields
});
```

**Client-Side Simplification:**
```javascript
// Before: Complex client-side lookup
const uploaderUser = connectedUsers.find(user => user.id === data.uploadedBy)
const senderName = uploaderUser?.username || 'Anonymous User'

// After: Direct server-provided username
const senderName = data.uploaderUsername || 'Anonymous User'
```

## Consequences

### Positive
- **Reliable Username Display**: Always shows correct username, no race conditions
- **Server Authority**: Username comes from authoritative server session data
- **Simplified Client Logic**: No complex client-side user lookups required
- **Better UX**: Users see proper names like "Anonymous User 2" instead of generic "Anonymous User"
- **Reduced Dependencies**: Client doesn't depend on synchronized user list state

### Negative
- **Slightly Increased Payload**: Additional string field in socket events (~10-20 bytes)
- **Server Logic**: Additional username lookup on server for each file upload

### Neutral
- **Backward Compatibility**: Existing clients will ignore the new field
- **Fallback Preserved**: Still falls back to "Anonymous User" if username unavailable
- **Double Implementation**: Updated both direct upload and chunked upload paths

## Implementation Details

**Files Modified:**
1. **`socket-server/server.js`**:
   - Updated file upload handler (line ~390)
   - Updated chunked upload completion handler (line ~1185)
   - Added username lookup from `activeSessions` map

2. **`client/src/App.jsx`**:
   - Simplified image thumbnail username logic
   - Removed dependency on `connectedUsers` array lookup

**Server Username Resolution:**
- Uses `activeSessions.get(sessionId)?.get(userId)` for authoritative lookup
- Falls back to "Anonymous User" if session/user data not found
- Preserves existing username generation logic (Anonymous User 2, 3, etc.)

**Event Structure Enhancement:**
```javascript
// New file-available event structure
{
  fileId: string,
  filename: string,
  size: number,
  mimeType: string,
  uploadedBy: string,        // Socket ID (existing)
  uploaderUsername: string,  // Username (new)
  timestamp: number
}
```

## Validation
- ✅ Server syntax validation passed
- ✅ Client builds successfully with new event structure
- ✅ Fallback logic preserved for edge cases
- ✅ Both upload paths (direct and chunked) updated consistently

## References
- Bug report: Image modal always showing "Anonymous User"
- Related: Image thumbnail preview system (ADR-0004)
- Server session management: `activeSessions` Map structure