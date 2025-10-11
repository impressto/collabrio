# ADR-0002: Extract SharedAudioManager Utility Class

## Status
Accepted

## Date
2025-10-11

## Context
The main App.jsx component had grown to over 1000 lines with audio-related functionality scattered throughout. This created several maintainability issues:

- **Monolithic Structure**: Audio logic embedded within main application component
- **Testing Difficulties**: Audio features tightly coupled, hard to test independently  
- **Code Reuse Limitations**: Audio functionality not available to other components
- **Mixed Concerns**: UI state management mixed with audio business logic
- **Scalability**: Adding new audio features required modifying the main component

The audio system includes:
- Sound playback with WebAudio API integration
- Floating icon animations with deduplication
- Socket.IO event broadcasting for multi-user sync
- State management for active animations

## Decision
Extract all audio-related functionality into a dedicated `SharedAudioManager` utility class.

**Architecture:**
```javascript
// SharedAudioManager.js - Centralized audio logic
export class SharedAudioManager {
  handlePlayAudio(audioKey, dependencies) 
  createFloatingIcon(audioKey, username, stateFunctions)
  playSharedAudio(audioKey, username, callbacks)
}

// App.jsx - Thin wrapper methods
const sharedAudioManager = new SharedAudioManager()
const handlePlayAudio = (audioKey) => 
  sharedAudioManager.handlePlayAudio(audioKey, dependencies)
```

**Refactoring Approach:**
- Move audio methods to SharedAudioManager class
- Pass dependencies as parameters (socket, audioManager, state setters)
- Maintain existing public API for backward compatibility
- Use singleton pattern for consistent state management

## Consequences

### Positive
- **Reduced Complexity**: App.jsx reduced from 1021 to 941 lines (80 lines removed)
- **Separation of Concerns**: Audio logic cleanly separated from UI components
- **Testability**: Audio functionality can be unit tested independently
- **Reusability**: SharedAudioManager can be imported by other components
- **Maintainability**: Audio features isolated for easier debugging and enhancement

### Negative
- **Abstraction Layer**: Additional indirection between UI and audio functionality
- **Dependency Management**: Need to carefully pass dependencies to utility class
- **Migration Risk**: Potential for introducing bugs during extraction process

### Neutral
- **Singleton Pattern**: Ensures consistent audio state across components
- **File Structure**: New utility file adds to project structure
- **Documentation**: Need to document SharedAudioManager API

## Implementation Details
**File Structure:**
```
client/src/
  components/SharedAudioManager.js  # New utility class (139 lines)
  App.jsx                          # Refactored main component (941 lines)
```

**Key Methods Extracted:**
- `handlePlayAudio()` - Main audio playback orchestration
- `createFloatingIcon()` - Animation lifecycle management  
- `playSharedAudio()` - Socket broadcasting + local playback

**Dependencies Passed:**
- `socket` - WebSocket connection for multi-user sync
- `audioManager` - WebAudio API wrapper for sound playback
- State setters - React hooks for animation tracking

## Validation
- ✅ Build successful after refactoring
- ✅ All audio features working correctly
- ✅ No regressions in floating icon animations
- ✅ Socket broadcasting maintained
- ✅ Multi-user audio sync preserved

## References
- Original decision: DEC-022 in `docs/archive/decision-log.md`
- Implementation: `client/src/components/SharedAudioManager.js`
- Related ADR: [ADR-0004: Floating Icon Duplication Fix](adr-0004-floating-icon-duplication-fix.md)