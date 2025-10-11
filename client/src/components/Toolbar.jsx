import React from 'react'
import { getToolbarAudioOptions } from '../config/sharedAudio.js'

function Toolbar({ 
  shareSession, 
  darkTheme, 
  setDarkTheme, 
  sessionId, 
  leaveSession,
  onFileShare,
  onRandomIcebreaker,
  isConnected,
  randomCooldown,
  onPlayAudio
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

  // Get available audio files from centralized configuration
  const audioFiles = getToolbarAudioOptions();

  const handleAudioSelect = (e) => {
    const audioKey = e.target.value;
    
    if (audioKey && onPlayAudio) {
      onPlayAudio(audioKey);
    }
    
    // Reset dropdown to default
    e.target.value = '';
  };

  return (
    <div className="toolbar">
      <button id="share-session-btn" onClick={shareSession} className="share-button">
        📱 Invite
      </button>
      <button 
        id="share-file-btn" 
        onClick={handleFileShare} 
        className="share-file-button"
        title="Share a file with session participants"
      >
        📎 Attach
      </button>
      <button 
        id="random-icebreaker-btn"
        onClick={onRandomIcebreaker}
        className={`share-button ${randomCooldown > 0 ? 'disabled' : ''}`}
        disabled={randomCooldown > 0}
        title={randomCooldown > 0 ? `Please wait ${randomCooldown} seconds` : "Generate a random icebreaker for the meeting"}
      >
        🎲 {randomCooldown > 0 ? `Random (${randomCooldown}s)` : 'Random'}
      </button>
      <button 
        id="leave-session-btn"
        onClick={leaveSession}
        className="leave-session-button"
      >
        🚪 Leave
      </button>
      <select 
        id="audio-selector"
        onChange={handleAudioSelect}
        className="audio-selector"
        title="Play sound for all session participants"
        disabled={!isConnected}
      >
        {audioFiles.map((audio) => (
          <option key={audio.value} value={audio.value}>
            {audio.label}
          </option>
        ))}
      </select>
      <button 
        id="theme-toggle-btn" 
        onClick={() => setDarkTheme(!darkTheme)} 
        className="theme-toggle-icon"
        title={darkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      >
        {darkTheme ? '☀️' : '🌙'}
      </button>
      <span className="connection-status connection-status-right">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </span>
    </div>
  )
}

export default Toolbar