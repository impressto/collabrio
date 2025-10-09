// Identity management utility functions for Collabrio
// Handles localStorage operations and identity validation

const IDENTITY_STORAGE_KEY = 'collabrio-user-identity'

// Funny random name lists for default username generation
const FUNNY_FIRST_WORDS = [
  'Skibby', 'Goob', 'Blib', 'Soggy', 'Crungy', 'Womp', 'Lil', 'Bonk',
  'Yeet', 'Rizz', 'Skronk', 'Floob', 'Doink', 'Smol', 'Blep'
]

const FUNNY_SECOND_WORDS = [
  'Goblin', 'Nug', 'Worm', 'Dude', 'Slime', 'Bop', 'Muffin', 'Rat',
  'Plug', 'Pebble', 'Bug', 'Snacc', 'Crumb', 'Goose'
]

/**
 * Generate a random funny username
 * @returns {string} A randomly generated funny username
 */
export const generateFunnyUsername = () => {
  const firstWord = FUNNY_FIRST_WORDS[Math.floor(Math.random() * FUNNY_FIRST_WORDS.length)]
  const secondWord = FUNNY_SECOND_WORDS[Math.floor(Math.random() * FUNNY_SECOND_WORDS.length)]
  return `${firstWord} ${secondWord}`
}

// Default identity structure
const DEFAULT_IDENTITY = {
  username: '',
  avatar: '',
  timestamp: null
}

/**
 * Get stored identity from localStorage
 * @returns {object} Identity object or default if not found
 */
export const getStoredIdentity = () => {
  try {
    const stored = localStorage.getItem(IDENTITY_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate structure
      if (parsed.username && parsed.avatar && parsed.timestamp) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Failed to parse stored identity:', error)
  }
  
  return null
}

/**
 * Save identity to localStorage
 * @param {string} username - User's chosen username
 * @param {string} avatar - User's chosen avatar emoji
 */
export const saveIdentity = (username, avatar) => {
  const identity = {
    username: username.trim(),
    avatar,
    timestamp: Date.now()
  }
  
  try {
    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity))
    return identity
  } catch (error) {
    console.error('Failed to save identity:', error)
    return null
  }
}

/**
 * Clear stored identity from localStorage
 */
export const clearStoredIdentity = () => {
  try {
    localStorage.removeItem(IDENTITY_STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear identity:', error)
    return false
  }
}

/**
 * Check if stored identity exists and is valid
 * @returns {boolean} True if valid identity exists
 */
export const hasValidStoredIdentity = () => {
  const identity = getStoredIdentity()
  return identity !== null
}

/**
 * Generate a unique username when conflicts occur
 * @param {string} baseUsername - Base username to make unique
 * @param {Array} takenUsernames - List of already taken usernames
 * @returns {string} Unique username
 */
export const generateUniqueUsername = (baseUsername, takenUsernames = []) => {
  if (!takenUsernames.includes(baseUsername)) {
    return baseUsername
  }
  
  let counter = 2
  let uniqueUsername = `${baseUsername} ${counter}`
  
  while (takenUsernames.includes(uniqueUsername)) {
    counter++
    uniqueUsername = `${baseUsername} ${counter}`
  }
  
  return uniqueUsername
}

/**
 * Generate a default anonymous username
 * @param {Array} takenUsernames - List of already taken usernames
 * @returns {string} Default username
 */
export const generateDefaultUsername = (takenUsernames = []) => {
  return generateUniqueUsername('Anonymous User', takenUsernames)
}

/**
 * Validate username according to rules
 * @param {string} username - Username to validate
 * @param {Array} takenUsernames - List of taken usernames (optional)
 * @param {string} currentUsername - Current user's username (for editing, optional)
 * @returns {object} {isValid: boolean, error: string}
 */
export const validateUsername = (username, takenUsernames = [], currentUsername = '') => {
  // Length validation
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' }
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' }
  }
  
  // Character validation (alphanumeric + spaces)
  if (!/^[a-zA-Z0-9 ]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and spaces' }
  }
  
  // Uniqueness validation (skip if it's the current user's username)
  if (takenUsernames.includes(username) && username !== currentUsername) {
    return { isValid: false, error: 'Username is already taken in this session' }
  }
  
  return { isValid: true, error: '' }
}

/**
 * Get available avatars from a list of taken avatars
 * @param {Array} allAvatars - Complete list of avatar options
 * @param {Array} takenAvatars - List of taken avatars
 * @returns {Array} Available avatars
 */
export const getAvailableAvatars = (allAvatars, takenAvatars = []) => {
  return allAvatars.filter(avatar => !takenAvatars.includes(avatar))
}

/**
 * Select a random available avatar
 * @param {Array} allAvatars - Complete list of avatar options
 * @param {Array} takenAvatars - List of taken avatars
 * @returns {string} Random available avatar or fallback
 */
export const getRandomAvatar = (allAvatars, takenAvatars = []) => {
  const available = getAvailableAvatars(allAvatars, takenAvatars)
  
  if (available.length === 0) {
    // Fallback if all avatars are taken (unlikely with 30 avatars)
    return '👤'
  }
  
  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

/**
 * Prepare identity for session (resolve conflicts, apply defaults)
 * @param {object} identity - User's preferred identity
 * @param {Array} takenUsernames - List of taken usernames in session
 * @param {Array} takenAvatars - List of taken avatars in session
 * @param {Array} allAvatars - Complete list of avatar options
 * @returns {object} Final identity ready for use
 */
export const prepareIdentityForSession = (identity, takenUsernames = [], takenAvatars = [], allAvatars = []) => {
  let { username, avatar } = identity
  
  // Resolve username conflicts
  if (takenUsernames.includes(username)) {
    username = generateUniqueUsername(username, takenUsernames)
  }
  
  // Resolve avatar conflicts or assign random if none selected
  if (!avatar || takenAvatars.includes(avatar)) {
    avatar = getRandomAvatar(allAvatars, takenAvatars)
  }
  
  return { username, avatar }
}

export default {
  getStoredIdentity,
  saveIdentity,
  clearStoredIdentity,
  hasValidStoredIdentity,
  generateUniqueUsername,
  generateDefaultUsername,
  validateUsername,
  getAvailableAvatars,
  getRandomAvatar,
  prepareIdentityForSession
}