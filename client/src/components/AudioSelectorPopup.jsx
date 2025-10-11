import React from 'react'

function AudioSelectorPopup({ isVisible, onClose, onSelectAudio, audioOptions, isConnected }) {
  if (!isVisible) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleAudioClick = (audioKey) => {
    onSelectAudio(audioKey)
    onClose()
  }

  return (
    <div className="audio-selector-overlay" onClick={handleBackdropClick}>
      <div className="audio-selector-popup">
        <div className="audio-selector-header">
          <h3>🔊 Choose a Reaction Sound</h3>
          <button 
            className="audio-selector-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="audio-selector-grid">
          {audioOptions
            .filter(audio => audio.value !== '') // Skip the default "🔊 React" option
            .map((audio) => (
              <button
                key={audio.value}
                className={`audio-option-button ${!isConnected ? 'disabled' : ''}`}
                onClick={() => handleAudioClick(audio.value)}
                disabled={!isConnected}
                title={isConnected ? `Play ${audio.label}` : 'Not connected to session'}
              >
                <div className="audio-option-emoji">
                  {audio.label.split(' ')[0]} {/* Extract emoji from label */}
                </div>
                <div className="audio-option-name">
                  {audio.label.substring(audio.label.indexOf(' ') + 1)} {/* Extract name without emoji */}
                </div>
              </button>
            ))}
        </div>
        {!isConnected && (
          <div className="audio-selector-warning">
            ⚠️ Connect to a session to play sounds
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioSelectorPopup