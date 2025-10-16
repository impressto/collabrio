// Audio utility for managing all app sound effects
import config from '../config.js'

class AudioManager {
  constructor() {
    this.sounds = {}
    this.enabled = config.soundEffectsEnabled !== false
    this.volume = config.soundEffectsVolume || 0.5
  }
  
  preloadSound(name, filename) {
    if (!this.enabled) {
      return null
    }
    
    const audioUrl = `${config.baseUrl}/client/public/${filename}`
    
    try {
      const audio = new Audio(audioUrl)
      audio.preload = 'auto'
      audio.volume = this.volume
      this.sounds[name] = audio
      
      // Handle loading errors gracefully
      audio.onerror = (e) => {
        console.error(`AudioManager: Failed to load sound "${name}"`, e)
        delete this.sounds[name]
      }
      
      return audio
    } catch (error) {
      console.error(`AudioManager: Error creating audio for ${filename}:`, error)
      return null
    }
  }
  
  play(soundName, options = {}) {
    if (!this.enabled) {
      return
    }
    
    if (!this.sounds[soundName]) {
      console.warn(`AudioManager: Sound "${soundName}" not found`)
      return
    }
    
    const audio = this.sounds[soundName]
    
    try {
      audio.currentTime = 0 // Reset to beginning
      audio.loop = options.loop || false
      
      if (options.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume))
      }
      
      const playPromise = audio.play()
      
      if (playPromise) {
        playPromise.catch((error) => {
          // Handle autoplay policy or other play errors
          if (error.name !== 'AbortError') {
            console.warn(`Failed to play sound ${soundName}:`, error.name)
          }
        })
      }
      
      return playPromise
    } catch (error) {
      console.error(`AudioManager: Error playing sound ${soundName}:`, error)
      return null
    }
  }
  
  stop(soundName) {
    if (!this.sounds[soundName]) return
    
    const audio = this.sounds[soundName]
    try {
      audio.pause()
      audio.currentTime = 0
      audio.loop = false
    } catch (error) {
      console.warn(`Error stopping sound ${soundName}:`, error)
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach(audio => {
      if (audio) audio.volume = this.volume
    })
  }
  
  // Debug method to check loaded sounds
  getLoadedSounds() {
    const loaded = {}
    Object.keys(this.sounds).forEach(key => {
      const audio = this.sounds[key]
      loaded[key] = {
        loaded: !!audio,
        readyState: audio ? audio.readyState : 'none',
        src: audio ? audio.src : 'none'
      }
    })
    return loaded
  }
}

// Create singleton instance
export const audioManager = new AudioManager()

// AudioManager initialization complete

// Preload shared audio files from centralized configuration
import { sharedAudioClips } from '../config/sharedAudio.js'

// Preload all shared audio files (including system sounds)
sharedAudioClips.forEach(clip => {
  audioManager.preloadSound(clip.key, clip.filename)
})

// Audio files are loaded asynchronously

export default audioManager