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
      console.log(`AudioManager: Sound effects disabled, skipping preload of ${filename}`)
      return null
    }
    
    const audioUrl = `${config.baseUrl}/client/public/${filename}`
    console.log(`AudioManager: Preloading sound "${name}" from ${audioUrl}`)
    
    try {
      const audio = new Audio(audioUrl)
      audio.preload = 'auto'
      audio.volume = this.volume
      this.sounds[name] = audio
      
      // Handle loading success
      audio.oncanplaythrough = () => {
        console.log(`AudioManager: Successfully loaded sound "${name}" (${filename})`)
      }
      
      // Handle loading errors gracefully
      audio.onerror = (e) => {
        console.error(`AudioManager: Failed to load sound "${name}" (${filename}):`, e)
        delete this.sounds[name]
      }
      
      return audio
    } catch (error) {
      console.error(`AudioManager: Error creating audio for ${filename}:`, error)
      return null
    }
  }
  
  play(soundName, options = {}) {
    console.log(`AudioManager: Attempting to play sound "${soundName}"`, { enabled: this.enabled, soundExists: !!this.sounds[soundName] })
    
    if (!this.enabled) {
      console.warn(`AudioManager: Sound effects disabled`)
      return
    }
    
    if (!this.sounds[soundName]) {
      console.warn(`AudioManager: Sound "${soundName}" not found or failed to load`)
      return
    }
    
    const audio = this.sounds[soundName]
    console.log(`AudioManager: Playing "${soundName}" with options:`, options, 'Audio state:', { 
      readyState: audio.readyState, 
      volume: audio.volume,
      src: audio.src 
    })
    
    try {
      audio.currentTime = 0 // Reset to beginning
      audio.loop = options.loop || false
      
      if (options.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume))
      }
      
      const playPromise = audio.play()
      
      if (playPromise) {
        playPromise.then(() => {
          console.log(`AudioManager: Successfully started playing "${soundName}"`)
        }).catch((error) => {
          // Handle autoplay policy or other play errors
          console.error(`AudioManager: Failed to play "${soundName}":`, error.name, error.message)
          if (error.name !== 'AbortError') {
            console.warn(`Failed to play sound ${soundName}:`, error)
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
}

// Create singleton instance
export const audioManager = new AudioManager()

// Preload all sounds
audioManager.preloadSound('userJoin', 'chime.mp3')
audioManager.preloadSound('userLeave', 'leave.mp3')
audioManager.preloadSound('timer', 'timer.mp3')

export default audioManager