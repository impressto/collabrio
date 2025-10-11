// Shared Audio Manager - Handles floating icons and audio playback coordination
import { audioManager } from './audioUtils.js'
import { getAudioEmojis, getAudioDisplayNames } from '../config/sharedAudio.js'

export class SharedAudioManager {
  constructor() {
    this.audioDisplayNames = getAudioDisplayNames()
    this.audioEmojis = getAudioEmojis()
  }

  // Helper function to get user-friendly audio labels
  getAudioLabel(audioKey) {
    return this.audioDisplayNames[audioKey] || audioKey
  }

  // Helper function to get emoji for each audio key
  getAudioEmoji(audioKey) {
    return this.audioEmojis[audioKey] || '🔊'
  }

  // Create floating icon animation
  createFloatingIcon(audioKey, username, { floatingIcons, setFloatingIcons, activeAnimationIds, setActiveAnimationIds }) {
    const animationKey = `${username}-${audioKey}` // Composite key for user+audio combination
    
    // Check if there's already an active animation for this user+audio combination
    if (activeAnimationIds.has(animationKey)) {
      console.log(`Preventing duplicate animation: ${animationKey} already active`)
      return false // Prevent duplicate - animation already in progress
    }
    
    const iconId = Date.now() + Math.random() // Unique ID
    
    // Track this active animation
    setActiveAnimationIds(prev => new Map(prev).set(animationKey, iconId))
    
    const newIcon = {
      id: iconId,
      emoji: this.getAudioEmoji(audioKey),
      username: username,
      animationKey: animationKey // Store the key for cleanup
    }
    
    console.log(`Creating floating icon: ${animationKey} (ID: ${iconId})`)
    setFloatingIcons(prev => [...prev, newIcon])
    return true
  }

  // Remove floating icon when animation completes
  removeFloatingIcon(iconId, { setFloatingIcons, setActiveAnimationIds }) {
    setFloatingIcons(prev => {
      // Find the icon being removed to get its animation key
      const iconToRemove = prev.find(icon => icon.id === iconId)
      
      if (iconToRemove && iconToRemove.animationKey) {
        // Clean up active animation tracking
        setActiveAnimationIds(activeIds => {
          const newIds = new Map(activeIds)
          newIds.delete(iconToRemove.animationKey)
          console.log(`Completed animation: ${iconToRemove.animationKey} (ID: ${iconId})`)
          return newIds
        })
      }
      
      return prev.filter(icon => icon.id !== iconId)
    })
  }

  // Play shared audio for all session participants (from socket events)
  playSharedAudio(audioKey, username, { createFloatingIcon }) {
    const result = audioManager.play(audioKey)
    if (!result) {
      console.error('Audio play failed for:', audioKey)
    }
    
    // Create floating icon animation (visual indicator replaces toast notification)
    createFloatingIcon(audioKey, username)
  }

  // Handle audio selection from toolbar (local user action)
  handlePlayAudio(audioKey, {
    socketRef,
    isConnected,
    sessionId,
    userIdentity,
    recentAudioTriggers,
    setRecentAudioTriggers,
    createFloatingIcon,
    showToast
  }) {
    if (!socketRef.current || !isConnected) {
      showToast('Cannot play audio: Not connected to session', 'error')
      return
    }

    // Check for recent duplicate triggers (debouncing)
    const now = Date.now()
    const triggerKey = `${userIdentity.username}-${audioKey}`
    const lastTrigger = recentAudioTriggers.get(triggerKey)
    
    if (lastTrigger && (now - lastTrigger) < 1000) { // 1 second debounce
      showToast('Please wait before playing the same sound again', 'warning')
      return
    }
    
    // Update recent triggers
    setRecentAudioTriggers(prev => {
      const newMap = new Map(prev)
      newMap.set(triggerKey, now)
      
      // Clean up old entries (older than 5 seconds)
      for (const [key, timestamp] of newMap.entries()) {
        if (now - timestamp > 5000) {
          newMap.delete(key)
        }
      }
      
      return newMap
    })

    // Play locally immediately
    audioManager.play(audioKey)
    
    // Create floating icon for local user (visual indicator replaces toast notification)
    createFloatingIcon(audioKey, userIdentity.username)
    
    // Broadcast to other users
    socketRef.current.emit('play-audio', {
      sessionId: sessionId,
      audioKey: audioKey,
      username: userIdentity.username
    })
  }
}

// Export a singleton instance
export const sharedAudioManager = new SharedAudioManager()