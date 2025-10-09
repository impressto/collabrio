import React, { useState, useEffect } from 'react'
import { generateFunnyUsername } from '../utils/identityUtils'

// Predefined avatar set with magical creatures and animals
const AVATAR_OPTIONS = [
  '🧙‍♀️', '🧝‍♂️', '🧝‍♀️', '🧛‍♂️', '🧛‍♀️', '🧞‍♀️', '🧚‍♀️', '🦁',
  '🐸', '🐵', '🦊', '🐻', '🐼', '🐷', '🐮', '🐧',
  '🐦', '🐢', '🐍', '🦕', '🦖', '🐉', '🦞', '🦀',
  '🐠', '🐟', '🐬', '🦭', '🐊', '🪱', '🦉', '🕷️',
  '👾', '🤖', '👻', '💀', '🧌', '🧟‍♂️', '🦄', '🐔',
  '🦇', '🦉'
]





function IdentityModal({ 
  isVisible, 
  onComplete, 
  onSkip, 
  existingUsername = '', 
  existingAvatar = '',
  takenAvatars = [],
  takenUsernames = [],
  isFirstTime = true 
}) {
  const [username, setUsername] = useState(existingUsername)
  const [selectedAvatar, setSelectedAvatar] = useState(existingAvatar)
  const [usernameError, setUsernameError] = useState('')
  const [hasManuallyEditedUsername, setHasManuallyEditedUsername] = useState(false)

  // Auto-select random available avatar if none selected
  useEffect(() => {
    if (!selectedAvatar && isFirstTime) {
      const availableAvatars = AVATAR_OPTIONS.filter(avatar => !takenAvatars.includes(avatar))
      if (availableAvatars.length > 0) {
        const randomAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)]
        setSelectedAvatar(randomAvatar)
      }
    }
  }, [selectedAvatar, takenAvatars, isFirstTime])

  // Generate funny default username if none provided
  useEffect(() => {
    if (!username && isFirstTime) {
      let generatedUsername = generateFunnyUsername()
      
      // If the generated name is taken, keep generating until we find an available one
      while (takenUsernames.includes(generatedUsername)) {
        generatedUsername = generateFunnyUsername()
      }
      
      setUsername(generatedUsername)
    }
  }, [username, takenUsernames, isFirstTime])

  const validateUsername = (value, skipLengthCheck = false) => {
    if (value.length < 3 && !skipLengthCheck) {
      return 'Username must be at least 3 characters'
    }
    if (value.length > 20) {
      return 'Username must be 20 characters or less'
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and spaces'
    }
    if (takenUsernames.includes(value) && value !== existingUsername) {
      return 'Username is already taken in this session'
    }
    return ''
  }

  const handleUsernameChange = (e) => {
    const value = e.target.value
    setUsername(value)
    setHasManuallyEditedUsername(true)
    setUsernameError(validateUsername(value))
  }

  const handleSubmit = () => {
    // Skip length validation if user hasn't manually edited and we have an auto-generated username
    const skipLengthCheck = !hasManuallyEditedUsername && username.length > 0
    const error = validateUsername(username, skipLengthCheck)
    if (error) {
      setUsernameError(error)
      return
    }

    const finalAvatar = selectedAvatar || AVATAR_OPTIONS.find(avatar => !takenAvatars.includes(avatar)) || '👤'
    
    onComplete({
      username: username.trim(),
      avatar: finalAvatar
    })
  }

  const handleAvatarClick = (avatar) => {
    if (takenAvatars.includes(avatar) && avatar !== existingAvatar) {
      return // Don't select taken avatars
    }
    
    setSelectedAvatar(avatar)
    
    // Auto-submit if we have a valid username
    const skipLengthCheck = !hasManuallyEditedUsername && username.length > 0
    const error = validateUsername(username, skipLengthCheck)
    
    if (!error && username.trim()) {
      onComplete({
        username: username.trim(),
        avatar: avatar
      })
    }
  }

  const handleSkip = () => {
    // Use defaults if skipping
    const defaultUsername = username || 'Anonymous User 1'
    const defaultAvatar = selectedAvatar || AVATAR_OPTIONS.find(avatar => !takenAvatars.includes(avatar)) || '👤'
    
    onSkip({
      username: defaultUsername,
      avatar: defaultAvatar
    })
  }

  if (!isVisible) return null

  return (
    <div className="identity-modal-overlay">
      <div className="identity-modal">
        <div className="identity-modal-header">
          <h2>{isFirstTime ? '👋 Welcome to Collabrio!' : '✏️ Edit Your Identity'}</h2>
          <p>
            {isFirstTime 
              ? 'Pick a name, dammit!'
              : 'Update your username and avatar'
            }
          </p>
        </div>

        <div className="identity-modal-content">
          {/* Username Input */}
          <div className="username-section">
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username..."
              className={`username-input ${usernameError ? 'error' : ''}`}
              maxLength="20"
            />
            {usernameError && (
              <span className="error-message">{usernameError}</span>
            )}
            <span className="input-help">3-20 characters, letters, numbers, and spaces only</span>
          </div>

          {/* Avatar Selection */}
          <div className="avatar-section">
            <label>Choose Your Avatar</label>
            <div className="avatar-grid">
              {AVATAR_OPTIONS.map((avatar, index) => {
                const isTaken = takenAvatars.includes(avatar) && avatar !== existingAvatar
                const isSelected = selectedAvatar === avatar
                
                return (
                  <button
                    key={index}
                    className={`avatar-option ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                    onClick={() => handleAvatarClick(avatar)}
                    disabled={isTaken}
                    title={isTaken ? 'This avatar is already taken' : `Select ${avatar}`}
                  >
                    {avatar}
                    {isTaken && <span className="taken-indicator">✕</span>}
                  </button>
                )
              })}
            </div>
            <span className="input-help">
              {selectedAvatar 
                ? `Selected: ${selectedAvatar}` 
                : usernameError 
                  ? 'Fix username error first, then click an avatar to continue'
                  : 'Click an avatar to start collaborating!'}
            </span>
          </div>
        </div>

        {/* Only show buttons if there's an error or no avatar selected */}
        {(usernameError || !selectedAvatar) && (
          <div className="identity-modal-actions">
            <button
              className="identity-submit-btn"
              onClick={handleSubmit}
              disabled={!!usernameError}
            >
              {isFirstTime ? '🚀 Start Collaborating' : '💾 Save Changes'}
            </button>
            
            {isFirstTime && (
              <button
                className="identity-skip-btn"
                onClick={handleSkip}
              >
                Skip (Use Defaults)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default IdentityModal