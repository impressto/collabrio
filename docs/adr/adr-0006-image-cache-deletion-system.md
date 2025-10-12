# ADR-0006: Image Cache Deletion System

**Date:** 2024-10-12  
**Status:** Accepted  
**Deciders:** Development Team  

## Context

The existing image upload and caching system lacked a way for users to remove cached images from the server. This created several issues:

1. **Storage Management**: No mechanism to free up server storage space
2. **Content Control**: Users couldn't remove accidentally uploaded or inappropriate content
3. **Privacy Concerns**: Images remained permanently cached without user control
4. **Session Cleanup**: No way to remove unwanted content during active sessions

## Decision

Implement a comprehensive image deletion system with the following components:

### Backend Implementation
- **New DELETE endpoint** (`/cached-image/:sessionId/:fileId`) for removing cached images
- **Database integration** with `deleteCachedImageBySessionAndFileId()` method
- **File system cleanup** removing both cached files and database metadata
- **Real-time notifications** via Socket.IO `cached-image-deleted` event
- **Error handling** for missing files and unauthorized access

### Frontend Implementation
- **Delete button** in image thumbnail modal (conditional on cache status)
- **Confirmation dialog** to prevent accidental deletion
- **Real-time updates** removing images from all connected clients
- **Scrollable modal** ensuring delete button accessibility on large images
- **Visual feedback** with cached/non-cached status indicators

### UI/UX Considerations
- **Modal scrolling fix**: Changed from fixed-height overflow to scrollable content
- **Button positioning**: Ensured delete/download buttons always accessible
- **Responsive design**: Mobile-optimized delete confirmation dialogs
- **Visual hierarchy**: Clear indication of cached vs. non-cached images

## Consequences

### Positive
- **User Control**: Users can now manage their uploaded content
- **Storage Efficiency**: Ability to free up server storage space
- **Better UX**: Scrollable modals solve accessibility issues with large images
- **Real-time Sync**: All users see deletions immediately
- **Data Integrity**: Database and file system kept in sync

### Negative
- **Increased Complexity**: Additional API endpoints and database operations
- **Performance Impact**: File system and database operations on deletion
- **Race Conditions**: Potential edge cases with concurrent deletion attempts

### Risks Mitigated
- **Storage Overflow**: Users can now manage cache size
- **Content Issues**: Inappropriate content can be removed quickly
- **UI Accessibility**: Large images no longer hide action buttons

## Implementation Details

### Database Schema
```sql
-- Existing cached_images table supports deletion via session_id + file_id
DELETE FROM cached_images 
WHERE session_id = ? AND file_id = ?
```

### API Design
```javascript
DELETE /cached-image/:sessionId/:fileId
// Validates session, removes file, updates database, notifies clients
```

### Frontend Integration
```javascript
// Modal scrolling solution
.image-modal-content {
  overflow-y: auto;
  flex: 1;
}

// Conditional delete button
{onDelete && (image.isCached || testMode) && (
  <button onClick={handleDeleteClick}>Delete</button>
)}
```

## Alternatives Considered

1. **Batch Deletion**: Allow selecting multiple images for deletion
   - *Rejected*: Added complexity without clear user need

2. **Admin-Only Deletion**: Restrict deletion to session creators
   - *Rejected*: Goes against collaborative spirit of the platform

3. **Automatic Cleanup**: Time-based or size-based automatic deletion
   - *Rejected*: Users should maintain control over their content

4. **Soft Delete**: Mark as deleted but keep files
   - *Rejected*: Doesn't solve storage concerns

## Monitoring & Success Criteria

- **Performance**: Deletion operations complete within 500ms
- **Reliability**: No orphaned files or database entries
- **User Experience**: Delete button accessible on all image sizes
- **Real-time Sync**: All clients updated within 100ms of deletion

## Future Considerations

- **Bulk Operations**: Select and delete multiple images
- **Undo Functionality**: Temporary recovery window for accidental deletions
- **Storage Quotas**: Per-session or per-user storage limits
- **Audit Logging**: Track deletion activities for administrative purposes