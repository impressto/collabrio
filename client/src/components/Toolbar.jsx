import React from 'react'

function Toolbar({ 
  shareSession, 
  darkTheme, 
  setDarkTheme, 
  sessionId, 
  leaveSession,
  onFileShare
}) {
  const handleFileShare = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // Allow all file types - server will validate
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && onFileShare) {
        onFileShare(file);
      }
    };
    input.click();
  };

  return (
    <div className="toolbar">
      <button id="share-session-btn" onClick={shareSession} className="share-button">
        📱 Share Session
      </button>
      <button 
        id="share-file-btn" 
        onClick={handleFileShare} 
        className="share-file-button"
        title="Share a file with session participants"
      >
        📎 Share File
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