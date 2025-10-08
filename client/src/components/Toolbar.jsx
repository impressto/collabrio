import React from 'react'

function Toolbar({ 
  shareSession, 
  darkTheme, 
  setDarkTheme, 
  sessionId, 
  leaveSession 
}) {
  return (
    <div className="toolbar">
      <button id="share-session-btn" onClick={shareSession} className="share-button">
        📱 Share Session
      </button>
      <button 
        id="leave-session-btn"
        onClick={leaveSession}
        className="leave-session-button"
      >
        🚪 Leave Session
      </button>
      <button 
        id="theme-toggle-btn" 
        onClick={() => setDarkTheme(!darkTheme)} 
        className="theme-toggle-icon"
        title={darkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      >
        {darkTheme ? '☀️' : '🌙'}
      </button>
      <span id="session-id-display" className="session-id">Session: {sessionId}</span>
    </div>
  )
}

export default Toolbar