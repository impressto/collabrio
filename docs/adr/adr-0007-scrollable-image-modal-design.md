# ADR-0007: Scrollable Image Modal Design

**Date:** 2024-10-12  
**Status:** Accepted  
**Deciders:** Development Team  

## Context

The image thumbnail modal had a critical UX issue where large images would cause the action buttons (Download, Delete, Close) to be positioned below the viewport. Users had no way to scroll down to access these essential controls, making the delete functionality effectively unusable for large images.

### Problem Details
- **Fixed Modal Height**: Modal used `max-height: 90vh` with `overflow: hidden`
- **Large Image Overflow**: Images could exceed available space
- **Inaccessible Controls**: Buttons rendered below the fold with no scroll mechanism
- **Poor Mobile Experience**: Issue more pronounced on mobile devices with limited screen space

## Decision

Redesign the modal layout to use a flexbox-based scrollable content area:

### Layout Changes
```css
.image-modal-content {
  overflow-y: auto;  /* Enable vertical scrolling */
  flex: 1;           /* Take available space */
}

.image-modal-image {
  max-height: 60vh;  /* Reduced from 70vh */
  flex-shrink: 0;    /* Prevent compression */
}
```

### Mobile Optimizations
```css
@media (max-width: 768px) {
  .image-modal-image {
    max-height: 50vh;  /* More space for controls */
  }
}
```

## Consequences

### Positive
- **Always Accessible Controls**: Users can always scroll to reach action buttons
- **Better Space Utilization**: Flexbox layout adapts to content size
- **Improved Mobile UX**: Smaller image limits leave more room for controls
- **Consistent Behavior**: Works regardless of image dimensions
- **Future-Proof**: Layout scales well with additional content

### Negative
- **Slightly Smaller Images**: Default image size reduced to ensure button visibility
- **Scroll Requirement**: Users may need to scroll for very large images
- **Layout Complexity**: More CSS rules for responsive behavior

### Neutral
- **Visual Hierarchy**: Maintains focus on image while ensuring control access
- **Performance**: No significant impact on rendering performance

## Implementation Details

### CSS Architecture
```css
/* Main modal maintains fixed structure */
.image-modal {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* Header stays fixed */
.image-modal-header {
  flex-shrink: 0;
}

/* Content area becomes scrollable */
.image-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* Image respects new constraints */
.image-modal-image {
  max-height: 60vh;
  flex-shrink: 0;
  margin-bottom: 1rem;
}

/* Actions always visible at bottom */
.image-modal-actions {
  flex-shrink: 0;
}
```

### Responsive Breakpoints
- **Desktop**: Images max 60vh, full padding
- **Mobile**: Images max 50vh, reduced padding
- **Landscape Mobile**: Optimized for wider aspect ratios

## Alternatives Considered

1. **Fixed Button Positioning**: Absolutely position buttons at bottom
   - *Rejected*: Would overlay content and create visual conflicts

2. **Separate Scrollable Image Area**: Only make image container scrollable
   - *Rejected*: Creates awkward nested scroll regions

3. **Carousel/Pagination**: Break content into pages
   - *Rejected*: Overcomplicates simple modal interaction

4. **External Image Viewer**: Open images in separate window/tab
   - *Rejected*: Breaks inline collaborative experience

5. **Image Size Detection**: Dynamically adjust layout based on image dimensions
   - *Rejected*: Adds complexity without significant benefit

## User Experience Impact

### Before Fix
```
[Modal Header - Fixed]
[Large Image - Takes 90vh]
[Buttons - Below viewport, inaccessible] ❌
```

### After Fix
```
[Modal Header - Fixed]
[Scrollable Content Area]
  [Image - Max 60vh]
  [Info Section]
  [Action Buttons] ✅
[End Scrollable Area]
```

### User Journey Improvements
1. **Open Modal**: Image displays at appropriate size
2. **View Details**: Info and buttons visible without scrolling (small images)
3. **Large Images**: Natural scroll behavior reveals all content
4. **Take Action**: Download/Delete always accessible via scroll

## Testing Criteria

- **Small Images**: All content visible without scrolling
- **Large Images**: Buttons accessible via vertical scroll
- **Mobile Devices**: Touch scrolling works smoothly
- **Keyboard Navigation**: Arrow keys and Page Down/Up work
- **Screen Readers**: Proper focus management and content order

## Future Enhancements

- **Keyboard Shortcuts**: ESC to close, arrow keys for navigation
- **Zoom Functionality**: Allow users to zoom in/out on images
- **Gesture Support**: Pinch-to-zoom on mobile devices
- **Accessibility**: Enhanced ARIA labels and screen reader support
- **Animation**: Smooth scroll transitions for better UX