import React, { useState, useEffect, useRef } from 'react'
import { getToolbarAudioOptions } from '../config/sharedAudio.js'
import { getAllTopics } from '../utils/icebreakerUtils.js'
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
  onRemoveImage,
  onDeleteCachedImage,
  onSetAsBackground,
  editorMode,
  onStartGame
}) {
  const [showAudioPopup, setShowAudioPopup] = useState(false)
  const [showIcebreakerDropdown, setShowIcebreakerDropdown] = useState(false)
  const icebreakerDropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (icebreakerDropdownRef.current && !icebreakerDropdownRef.current.contains(event.target)) {
        setShowIcebreakerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close icebreaker dropdown and audio popup when switching to draft mode
  useEffect(() => {
    if (editorMode === 'draft') {
      setShowIcebreakerDropdown(false)
      setShowAudioPopup(false)
    }
  }, [editorMode])

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

  const handleIcebreakerDropdownToggle = () => {
    setShowIcebreakerDropdown(!showIcebreakerDropdown)
  }

  const handleIcebreakerTopicSelect = (topic) => {
    if (onRandomIcebreaker) {
      onRandomIcebreaker(topic) // Pass the specific topic instead of generating random
    }
    setShowIcebreakerDropdown(false)
  }

  const handleCloseIcebreakerDropdown = () => {
    setShowIcebreakerDropdown(false)
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
        disabled={!isConnected}
      >
        📎 Attach
      </button>

      {/* Icebreaker Dropdown */}
      <div className="icebreaker-dropdown-container" ref={icebreakerDropdownRef}>
        <button 
          id="icebreaker-dropdown-btn"
          onClick={handleIcebreakerDropdownToggle}
          className={`share-button ${(randomCooldown > 0 || editorMode === 'draft') ? 'disabled' : ''} ${showIcebreakerDropdown ? 'active' : ''}`}
          disabled={randomCooldown > 0 || editorMode === 'draft'}
          title={
            editorMode === 'draft' 
              ? "Switch to Live mode to use icebreakers" 
              : randomCooldown > 0 
                ? `Please wait ${randomCooldown} seconds` 
                : "Select an icebreaker topic"
          }
        >
          🎲 {randomCooldown > 0 ? `Wait (${randomCooldown}s)` : 'Random'} {showIcebreakerDropdown ? '▲' : '▼'}
        </button>
        
        {showIcebreakerDropdown && (
          <div className="icebreaker-dropdown-menu">
            {getAllTopics().map((topic, index) => (
              <button
                key={index}
                className="icebreaker-dropdown-item"
                onClick={() => handleIcebreakerTopicSelect(topic)}
                disabled={randomCooldown > 0 || editorMode === 'draft'}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Games Button */}
      <button 
        id="games-btn"
        onClick={onStartGame}
        className={`share-button ${editorMode === 'draft' ? 'disabled' : ''}`}
        disabled={editorMode === 'draft'}
        title={
          editorMode === 'draft' 
            ? "Switch to Live mode to play games" 
            : "Start a game for all participants"
        }
      >
        🎮 Games
      </button>
      
      <button 
        id="audio-selector-btn"
        onClick={handleAudioButtonClick}
        className="audio-selector-button"
        title={
          editorMode === 'draft' 
            ? "Switch to Live mode to use audio reactions" 
            : "Play sound for all session participants"
        }
        disabled={!isConnected || editorMode === 'draft'}
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
      {sharedImages
        .filter((image, index, array) => 
          // Remove duplicates by keeping only the first occurrence of each fileId
          array.findIndex(img => img.fileId === image.fileId) === index
        )
        .map((image) => (
          <ImageThumbnail 
            key={image.id}
            image={image}
            onRemove={onRemoveImage}
            onDelete={onDeleteCachedImage}
            onSetAsBackground={onSetAsBackground}
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