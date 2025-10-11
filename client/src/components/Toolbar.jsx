import React, { useState } from 'react'
import { getToolbarAudioOptions } from '../config/sharedAudio.js'
import AudioSelectorPopup from './AudioSelectorPopup.jsx'
import ImageThumbnail from './ImageThumbnail.jsx'

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
  onPlayAudio,
  sharedImages = [],
  onRemoveImage
}) {
  const [showAudioPopup, setShowAudioPopup] = useState(false)

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

  const handleAudioButtonClick = () => {
    setShowAudioPopup(true)
  }

  const handleAudioSelect = (audioKey) => {
    if (audioKey && onPlayAudio) {
      onPlayAudio(audioKey);
    }
  }

  const handleCloseAudioPopup = () => {
    setShowAudioPopup(false)
  }

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
        id="audio-selector-btn"
        onClick={handleAudioButtonClick}
        className="audio-selector-button"
        title="Play sound for all session participants"
        disabled={!isConnected}
      >
        🔊 React
      </button>
      <button 
        id="theme-toggle-btn" 
        onClick={() => setDarkTheme(!darkTheme)} 
        className="theme-toggle-icon"
        title={darkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      >
        {darkTheme ? '☀️' : '🌙'}
      </button>
      
      {/* Display image thumbnails */}
      {sharedImages.map((image) => (
        <ImageThumbnail 
          key={image.id}
          image={image}
          onRemove={onRemoveImage}
        />
      ))}
      
      <button 
        id="leave-session-btn"
        onClick={leaveSession}
        className="leave-session-button"
      >
        🚪 Exit
      </button>
      <span className="connection-status connection-status-right">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </span>

      <AudioSelectorPopup
        isVisible={showAudioPopup}
        onClose={handleCloseAudioPopup}
        onSelectAudio={handleAudioSelect}
        audioOptions={audioFiles}
        isConnected={isConnected}
      />
    </div>
  )
}

export default Toolbar