# ADR-0003: Floating Icon Duplication Bug Resolution

## Status  
Accepted

## Date
2025-10-11

## Context
Users reported floating icons occasionally appearing twice for the same sound selection, creating visual confusion and suggesting system instability. The issue manifested as:

- Icons appeared to "reset" and restart animation mid-flight
- Occurred across multiple clients simultaneously  
- Delay between duplicate icons ranged from 0.5-1+ seconds
- Happened intermittently, making debugging challenging

**Root Cause Analysis:**
The animation continued calculating positions after the icon became invisible (opacity = 0), creating a ~1 second window where duplicate icons could be spawned.

```javascript
// Problematic code
if (progress < 1) {
  requestAnimationFrame(animate) // Continued even when invisible
} else {
  onComplete(id) // Only called after full 3 seconds  
}
```

**Timeline Issue:**
- 0-2 seconds: Visible animation (opacity 1.0 → 0.0)
- 2-3 seconds: "Zombie" animation (invisible but still running)  
- During zombie period: New duplicate icons could be created

## Decision
Implement a multi-layered protection system combining early animation termination with ID-based deduplication tracking.

**Solution Architecture:**

1. **Early Animation Termination**
```javascript
// Terminate as soon as invisible OR time complete
if (newOpacity <= 0 || progress >= 1) {
  onComplete(id) 
}
```

2. **ID-Based Deduplication Tracking**  
```javascript
const [activeAnimationIds, setActiveAnimationIds] = useState(new Map())

const createFloatingIcon = (audioKey, username) => {
  const animationKey = `${username}-${audioKey}`
  if (activeAnimationIds.has(animationKey)) {
    return // Prevent duplicate
  }
  // Track active animation...
}
```

3. **Composite Key Prevention**
- Combine username + audioKey for unique identification
- Track active animations in React state
- Clean up tracking when animations complete

## Consequences

### Positive
- **Bug Elimination**: No more duplicate floating icons reported
- **Performance Improvement**: ~1 second less animation time per icon (33% reduction)
- **User Experience**: Cleaner visual feedback without confusing duplicates
- **System Stability**: Reduced requestAnimationFrame overhead
- **Predictable Behavior**: Consistent animation lifecycle across all clients

### Negative
- **Code Complexity**: Additional state management for animation tracking
- **Memory Overhead**: Map structure to track active animations
- **Debugging Surface**: More logic paths to consider when troubleshooting

### Neutral
- **Animation Duration**: Still maintains intended visual timing
- **Backwards Compatibility**: No changes to external API
- **Multi-User Sync**: Deduplication works across all connected clients

## Implementation Details

**Key Changes:**
1. Modified `FloatingIcon.jsx` animation loop for early termination
2. Added animation ID tracking in App.jsx state management
3. Implemented composite key system for username + audio combinations
4. Enhanced cleanup logic to prevent memory leaks

**Testing Validation:**
- Rapid clicking no longer creates duplicate icons
- Animation performance improved (measured via dev tools)
- Multi-user scenarios work correctly
- Memory usage stable over extended sessions

**Performance Metrics:**
- Animation duration: 3000ms → ~2000ms (average)
- RequestAnimationFrame calls reduced by ~30%
- No memory leaks detected in extended testing

## Risk Mitigation
- Maintained existing animation visual timing through opacity curve
- Preserved all multi-user synchronization functionality  
- Added comprehensive cleanup to prevent memory leaks
- Kept animation state isolated to prevent cross-contamination

## References
- Original bug report: Decision log DEC-020
- Related issue: "Zombie animations" performance problem
- Implementation files: `client/src/components/FloatingIcon.jsx`, `client/src/App.jsx`