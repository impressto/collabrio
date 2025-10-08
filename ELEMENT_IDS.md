# Collabrio Element IDs for Testing & Debugging

This document lists all the element IDs added to Collabrio for easier testing, debugging, and automation.

## 📝 Main Editor Elements

| Element | ID | Description |
|---------|----|-----------| 
| Collaborative Textarea | `collaborative-editor` | Main text editing area where users type |

## 🏠 Landing Page Elements

| Element | ID | Description |
|---------|----|-----------| 
| Create Session Button | `create-session-btn` | Button to create a new collaborative session |
| Join Session Input | `join-session-input` | Input field to enter existing session ID |

## 🔧 Toolbar Elements

| Element | ID | Description |
|---------|----|-----------| 
| Share Session Button | `share-session-btn` | Opens QR code modal for sharing |
| Copy Link Button | `copy-link-btn` | Copies session URL to clipboard |
| Theme Toggle Button | `theme-toggle-btn` | Switches between light and dark themes |
| Leave Session Button | `leave-session-btn` | Leaves current session and returns to landing |

## 📊 Status Display Elements

| Element | ID | Description |
|---------|----|-----------| 
| Connection Status | `connection-status` | Shows connected/disconnected status |
| Connection Type Display | `connection-type-display` | Shows connection method (websocket) |
| User Count Display | `user-count-display` | Shows number of connected users |
| Session ID Display | `session-id-display` | Shows current session ID |

## 📱 Modal Elements

| Element | ID | Description |
|---------|----|-----------| 
| QR Modal Overlay | `qr-modal-overlay` | Background overlay for QR code modal |
| QR Modal Content | `qr-modal-content` | Main content area of QR code modal |
| QR Code | `qr-code` | The actual QR code component |
| Share Link Input | `share-link-input` | Read-only input with session URL |
| Modal Copy Button | `modal-copy-btn` | Copy button within the modal |
| Modal Close Button | `modal-close-btn` | Close button for the modal |

## 🧪 Testing Examples

### JavaScript Testing (Browser Console)
```javascript
// Check if user is connected
document.getElementById('connection-status').textContent

// Get current session ID
document.getElementById('session-id-display').textContent

// Toggle dark theme
document.getElementById('theme-toggle-btn').click()

// Type in the editor
document.getElementById('collaborative-editor').value = 'Test content'
document.getElementById('collaborative-editor').dispatchEvent(new Event('input'))

// Create a new session
document.getElementById('create-session-btn').click()

// Join a specific session
const joinInput = document.getElementById('join-session-input')
joinInput.value = 'abc123'
joinInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }))
```

### Automated Testing (Playwright/Cypress)
```javascript
// Playwright examples
await page.click('#create-session-btn')
await page.fill('#collaborative-editor', 'Hello collaborative world!')
await page.click('#share-session-btn')
await page.click('#theme-toggle-btn')

// Cypress examples  
cy.get('#collaborative-editor').type('Testing collaborative editing')
cy.get('#connection-status').should('contain', 'Connected')
cy.get('#user-count-display').should('contain', '1 user')
cy.get('#session-id-display').should('contain', 'Session:')
```

### CSS Selectors for Styling/Debugging
```css
/* Target specific elements during development */
#collaborative-editor { border: 2px solid red !important; }
#connection-status.connected { background: green; }
#theme-toggle-btn:hover { transform: scale(1.1); }
```

## 📋 Testing Checklist

### Basic Functionality Tests
- [ ] `#create-session-btn` creates new session
- [ ] `#join-session-input` accepts session IDs  
- [ ] `#collaborative-editor` allows typing and shows content
- [ ] `#connection-status` shows correct connection state
- [ ] `#user-count-display` updates when users join/leave

### UI Interaction Tests
- [ ] `#share-session-btn` opens QR modal
- [ ] `#copy-link-btn` copies URL to clipboard
- [ ] `#theme-toggle-btn` switches between light/dark themes
- [ ] `#leave-session-btn` returns to landing page
- [ ] `#modal-close-btn` closes QR modal

### State Persistence Tests
- [ ] Theme preference persists after page reload
- [ ] Session content persists when new users join
- [ ] Session ID remains consistent during session

## 🔍 Debugging Tips

1. **Check Element Existence**: Use `document.getElementById('element-id')` to verify elements exist
2. **Monitor State Changes**: Watch `#connection-status` and `#user-count-display` for real-time updates
3. **Test User Flows**: Use IDs to simulate complete user journeys programmatically
4. **Theme Testing**: Toggle `#theme-toggle-btn` to test both light and dark mode styling
5. **Session Management**: Use `#session-id-display` to track session transitions

---

*This document should be updated whenever new interactive elements are added to the application.*