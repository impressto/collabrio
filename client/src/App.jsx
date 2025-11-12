import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import config from './config.js'
import { audioManager } from './utils/audioUtils.js'
import './App.css'

// Components
import LandingPage from './components/LandingPage'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import ShareModal from './components/ShareModal'
import Toast from './components/Toast'
import FileNotification from './components/FileNotification'
import UploadProgress from './components/UploadProgress'
import WordSelection from './components/WordSelection'
import Footer from './components/Footer'
import IdentityModal from './components/IdentityModal'
import SchoolAuthModal from './components/SchoolAuthModal'
import FloatingIcon from './components/FloatingIcon'
import ImageThumbnail from './components/ImageThumbnail'
import DrawingGame from './components/DrawingGame'

// Utilities
import { 
  getStoredIdentity, 
  saveIdentity, 
  hasValidStoredIdentity,
  generateFunnyUsername
} from './utils/identityUtils'
import { getRandomTopic, createIcebreakerPrompt } from './utils/icebreakerUtils'
import { isValidSchoolNumber, getAllSchools, getSchoolName } from './utils/schoolUtils'
import { sharedAudioManager } from './utils/sharedAudioManager.js'

// Avatar options (same as in IdentityModal)
const AVATAR_OPTIONS = [
  '🧙‍♀️', '🧝‍♂️', '🧝‍♀️', '🧛‍♂️', '🧛‍♀️', '🧞‍♀️', '🧚‍♀️', '🦁',
  '🐸', '🐵', '🦊', '🐻', '🐼', '🐷', '🐮', '🐧',
  '🐦', '🐢', '🐍', '🦕', '🦖', '🐉', '🦞', '🦀',
  '🐠', '🐟', '🐬', '🦭', '🐊', '🪱', '🦉', '🕷️',
  '👾', '🤖', '👻', '💀', '🧌', '🧟‍♂️', '🦄', '🐔',
  '🦇', '🦉'
]



function App() {
  // State management
  const [sessionId, setSessionId] = useState('')
  const [document, setDocument] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [connectionType, setConnectionType] = useState('websocket') // 'webrtc' or 'websocket'
  const [isInSession, setIsInSession] = useState(false)
  const [darkTheme, setDarkTheme] = useState(() => {
    // Initialize dark theme from localStorage
    const saved = localStorage.getItem('collabrio-dark-theme')
    return saved ? JSON.parse(saved) : false
  })
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [floatingIcons, setFloatingIcons] = useState([])
  const [activeAnimationIds, setActiveAnimationIds] = useState(new Map()) // Track active animation IDs by username+audioKey
  const [recentAudioTriggers, setRecentAudioTriggers] = useState(new Map()) // Track recent audio triggers to prevent spam
  const [editorMode, setEditorMode] = useState('live') // 'live' or 'draft'
  const [draftContent, setDraftContent] = useState(() => {
    // Initialize draft content from localStorage
    const saved = localStorage.getItem('collabrio-draft-content')
    return saved || ''
  })
  
  // File sharing state
  const [fileNotifications, setFileNotifications] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUploadFile, setCurrentUploadFile] = useState(null)
  const [sharedImages, setSharedImages] = useState([])
  
  // Server configuration state
  const [serverConfig, setServerConfig] = useState({
    maxFileSize: 100 * 1024 * 1024, // Default 100MB
    maxFileSizeMB: 100,
    fileTimeout: 300000, // 5 minutes
    maxUploadsPerUser: 3,
    uploadWindow: 300000 // 5 minutes
  })
  
  // School authentication state
  const [isSchoolAuthenticated, setIsSchoolAuthenticated] = useState(() => {
    // Check if user has valid school auth in localStorage
    const stored = localStorage.getItem('collabrio-school-auth')
    return stored && isValidSchoolNumber(stored)
  })
  const [showSchoolAuthModal, setShowSchoolAuthModal] = useState(false)

  // Button cooldown state
  const [randomCooldown, setRandomCooldown] = useState(0)
  const [randomCooldownTimer, setRandomCooldownTimer] = useState(null)
  
  // Drawing game state
  const [gameActive, setGameActive] = useState(false) // Controls button disable/enable
  const [showGameModal, setShowGameModal] = useState(false) // Controls modal visibility
  const [showWordSelection, setShowWordSelection] = useState(false) // Controls word selection modal
  const [wordChoices, setWordChoices] = useState([]) // Available word choices
  const [gameState, setGameState] = useState({
    drawer: null,
    word: '',
    timeLeft: 60,
    guesses: [],
    isCorrectGuess: false,
    winner: null,
    winners: [],
    correctWord: ''
  })
  
  // Use refs for icebreaker data to persist across async operations
  const icebreakerCursorPositionRef = useRef(null)
  const icebreakerEditorModeRef = useRef(null)

  // Identity state
  const [userIdentity, setUserIdentity] = useState(() => {
    const stored = getStoredIdentity()
    return stored || { username: '', avatar: '' }
  })
  const [showIdentityModal, setShowIdentityModal] = useState(false)
  const [pendingSessionAction, setPendingSessionAction] = useState(null) // 'create' or 'join'
  const [currentUserId, setCurrentUserId] = useState('')
  const [backgroundImage, setBackgroundImage] = useState(null)
  
  // Refs
  const socketRef = useRef(null)
  const textareaRef = useRef(null)
  const draftRef = useRef(null)
  const currentFileUpload = useRef(null)
  
  // User activity tracking for auto-scroll
  const lastUserActivityRef = useRef(Date.now())
  const USER_INACTIVITY_THRESHOLD = 10000 // 10 seconds in milliseconds

  // Auto-scroll function to move textarea to bottom
  const autoScrollToBottom = useCallback(() => {
    const currentTime = Date.now()
    const timeSinceLastActivity = currentTime - lastUserActivityRef.current
    
    // Only auto-scroll if user hasn't been active recently
    if (timeSinceLastActivity >= USER_INACTIVITY_THRESHOLD) {
      const activeTextarea = editorMode === 'live' ? textareaRef.current : draftRef.current
      if (activeTextarea) {
        // Scroll to bottom of textarea
        activeTextarea.scrollTop = activeTextarea.scrollHeight
        console.log('🔽 Auto-scrolled to bottom (user inactive for', Math.round(timeSinceLastActivity / 1000), 'seconds)')
      }
    }
  }, [editorMode])

  // Update user activity timestamp
  const updateUserActivity = useCallback(() => {
    lastUserActivityRef.current = Date.now()
  }, [])

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('collabrio-dark-theme', JSON.stringify(darkTheme))
  }, [darkTheme])

  // Save draft content to localStorage
  useEffect(() => {
    localStorage.setItem('collabrio-draft-content', draftContent)
  }, [draftContent])

  // Fetch server configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${config.socketServerUrl}/config`)
        if (response.ok) {
          const serverConfig = await response.json()
          setServerConfig(serverConfig)
          console.log('Server config loaded:', serverConfig)
        } else {
          console.warn('Failed to fetch server config, using defaults')
        }
      } catch (error) {
        console.warn('Error fetching server config, using defaults:', error)
      }
    }
    
    fetchConfig()
  }, [])

  // Toast functionality
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  // Insert text at cursor position in the active editor
  const insertTextAtCursor = (textToInsert) => {
    const isLiveMode = editorMode === 'live'
    const activeRef = isLiveMode ? textareaRef : draftRef
    const currentContent = isLiveMode ? document : draftContent
    
    if (!activeRef.current) return

    const textarea = activeRef.current
    const cursorPosition = textarea.selectionStart
    const endPosition = textarea.selectionEnd
    
    // Create new content with inserted text
    const beforeCursor = currentContent.substring(0, cursorPosition)
    const afterCursor = currentContent.substring(endPosition)
    const newContent = beforeCursor + textToInsert + afterCursor
    
    // Check character limit
    if (newContent.length > config.maxDocumentChars) {
      showToast(`Cannot insert text: Document limit of ${config.maxDocumentChars.toLocaleString()} characters would be exceeded`, 'warning')
      return
    }
    
    // Update content based on current mode
    if (isLiveMode) {
      handleDocumentChange({ target: { value: newContent } })
    } else {
      handleDraftChange({ target: { value: newContent } })
    }
    
    // Focus and position cursor after inserted text
    setTimeout(() => {
      textarea.focus()
      const newCursorPosition = cursorPosition + textToInsert.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  // Play shared audio for all session participants
  const playSharedAudio = (audioKey, username) => {
    sharedAudioManager.playSharedAudio(audioKey, username, {
      createFloatingIcon
    })
  }

  // Handle audio selection from toolbar
  const handlePlayAudio = (audioKey) => {
    sharedAudioManager.handlePlayAudio(audioKey, {
      socketRef,
      isConnected,
      sessionId,
      userIdentity,
      recentAudioTriggers,
      setRecentAudioTriggers,
      createFloatingIcon,
      showToast
    })
  }

  // Create floating icon animation
  const createFloatingIcon = (audioKey, username) => {
    return sharedAudioManager.createFloatingIcon(audioKey, username, {
      floatingIcons,
      setFloatingIcons,
      activeAnimationIds,
      setActiveAnimationIds
    })
  }

  // Remove floating icon when animation completes
  const removeFloatingIcon = (iconId) => {
    sharedAudioManager.removeFloatingIcon(iconId, {
      setFloatingIcons,
      setActiveAnimationIds
    })
  }

  // Initialize session from URL hash - check school authentication first
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash) {
      // Check school authentication first for URL-based session joining
      if (!isSchoolAuthenticated) {
        setPendingSessionAction({ action: 'join', sessionId: hash })
        setShowSchoolAuthModal(true)
      } else {
        // Already school authenticated, show identity modal
        setPendingSessionAction({ action: 'join', sessionId: hash })
        setShowIdentityModal(true)
      }
    }
    // No auto-generation - user must explicitly create session
  }, [])

  // Connect to socket when sessionId is available and user is in session
  useEffect(() => {
    if (sessionId && isInSession && !socketRef.current) {
      connectToSocket()
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [sessionId, isInSession])

  // Document state changes are tracked for synchronization

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (randomCooldownTimer) {
        clearInterval(randomCooldownTimer)
      }
    }
  }, [])

  const generateSessionId = () => {
    // Generate a simple 6-character session ID
    // Using base36 (0-9, a-z) for URL-friendly characters
    return Math.random().toString(36).substring(2, 8)
  }

  const getCurrentSchoolName = () => {
    if (!isSchoolAuthenticated) return null
    const stored = localStorage.getItem('collabrio-school-auth')
    return stored ? getSchoolName(stored) : null
  }

  const getSessionSchoolNames = () => {
    const schoolNumbers = new Set()
    
    // Add current user's school
    if (isSchoolAuthenticated) {
      const stored = localStorage.getItem('collabrio-school-auth')
      if (stored) {
        schoolNumbers.add(stored)
      }
    }
    
    // Add connected users' schools (if they have schoolNumber in their data)
    connectedUsers.forEach(user => {
      if (user.schoolNumber) {
        schoolNumbers.add(user.schoolNumber)
      }
    })
    
    // Convert to school names
    const schoolNames = Array.from(schoolNumbers)
      .map(number => getSchoolName(number))
      .filter(Boolean)
      .sort()
    
    return schoolNames.length > 0 ? schoolNames.join(' and ') : null
  }

  const createNewSession = () => {
    // Check school authentication first
    if (!isSchoolAuthenticated) {
      setPendingSessionAction('create')
      setShowSchoolAuthModal(true)
      return
    }
    
    // Show identity modal for session creation
    setPendingSessionAction('create')
    setShowIdentityModal(true)
  }

  const joinExistingSession = (sessionIdToJoin) => {
    // Check school authentication first
    if (!isSchoolAuthenticated) {
      setPendingSessionAction({ action: 'join', sessionId: sessionIdToJoin })
      setShowSchoolAuthModal(true)
      return
    }
    
    // Show identity modal for session joining
    setPendingSessionAction({ action: 'join', sessionId: sessionIdToJoin })
    setShowIdentityModal(true)
  }

  // School authentication handlers
  const handleSchoolAuthComplete = (schoolNumber) => {
    console.log('School authentication successful:', schoolNumber)
    setIsSchoolAuthenticated(true)
    setShowSchoolAuthModal(false)
    
    // Continue with pending session action
    if (pendingSessionAction === 'create') {
      setPendingSessionAction('create')
      setShowIdentityModal(true)
    } else if (pendingSessionAction && pendingSessionAction.action === 'join') {
      setPendingSessionAction(pendingSessionAction)
      setShowIdentityModal(true)
    }
  }

  const handleSchoolAuthCancel = () => {
    setShowSchoolAuthModal(false)
    setPendingSessionAction(null)
    // Clear URL hash if user cancels school auth from a link
    window.location.hash = ''
  }

  // Identity handling functions
  const handleIdentityComplete = (identity) => {
    // Safety check: Ensure school authentication is still valid
    if (!isSchoolAuthenticated) {
      console.warn('Identity completion attempted without school authentication')
      setShowIdentityModal(false)
      setShowSchoolAuthModal(true)
      return
    }
    
    // Save identity to localStorage
    saveIdentity(identity.username, identity.avatar)
    setUserIdentity(identity)
    setShowIdentityModal(false)
    
    // Execute pending session action
    if (pendingSessionAction === 'create') {
      const newSessionId = generateSessionId()
      setDocument('')
      setSessionId(newSessionId)
      setIsInSession(true)
      window.location.hash = newSessionId
    } else if (pendingSessionAction && pendingSessionAction.action === 'join') {
      setDocument('')
      setSessionId(pendingSessionAction.sessionId)
      setIsInSession(true)
      window.location.hash = pendingSessionAction.sessionId
    }
    
    setPendingSessionAction(null)
  }

  const handleIdentitySkip = (identity) => {
    // Save default identity
    handleIdentityComplete(identity)
  }

  const connectToSocket = () => {
    // Connect to the socket server using configuration
    const socket = io(config.socketServerUrl, {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log(`Connected to socket server at ${config.socketServerUrl}`)
      console.log(`Joining session: ${sessionId}`)
      setIsConnected(true)
      setCurrentUserId(socket.id)
      
      // Include user identity and school auth when joining session
      const identity = userIdentity.username ? userIdentity : getStoredIdentity()
      const schoolAuth = localStorage.getItem('collabrio-school-auth')
      socket.emit('join-session', { 
        sessionId, 
        clientId: socket.id,
        schoolAuth: schoolAuth,
        userIdentity: {
          username: identity?.username || generateFunnyUsername(),
          avatar: identity?.avatar || AVATAR_OPTIONS[0]
        }
      })
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server')
      setIsConnected(false)
      setConnectedUsers([]) // Clear user list on disconnect
    })

    socket.on('auth-error', (data) => {
      console.error('Authentication error:', data.message)
      
      // Clear stored school auth and force re-authentication
      localStorage.removeItem('collabrio-school-auth')
      setIsSchoolAuthenticated(false)
      
      // Show error and redirect back to landing
      showToast(`Authentication failed: ${data.message}`, 'error')
      setSessionId('')
      setIsInSession(false)
      setConnectedUsers([])
      
      // Disconnect from socket
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    })

    socket.on('document-update', (data) => {
      setDocument(data.document)
      
      // Auto-scroll to bottom if user hasn't been typing recently
      // Only trigger if the update came from another user (not from current user)
      if (data.updatedBy !== currentUserId && data.updatedBy !== 'ai-system') {
        autoScrollToBottom()
      }
    })

    socket.on('background-image-update', (data) => {
      setBackgroundImage(data.backgroundImage)
      if (data.filename) {
        showToast(`Background changed to "${data.filename}" by another user`, 'info')
      } else if (data.backgroundImage === null) {
        showToast('Background image cleared by another user', 'info')
      }
    })

    socket.on('user-joined', (data) => {
      // Play chime sound if there are already other users in the session
      // (don't play on initial connection when joining alone)
      if (data.users && data.users.length > 1) {
        audioManager.play('userJoin')
      }
      
      setConnectedUsers(data.users)
    })

    socket.on('user-left', (data) => {
      // Play leave sound when someone leaves
      audioManager.play('userLeave')
      
      setConnectedUsers(data.users)
    })

    socket.on('server-text-injection', (data) => {
      // Insert server text into the document with formatting
      const injectedText = `\n\n[${data.type.toUpperCase()}] ${data.text}\n\n`
      setDocument(prevDoc => prevDoc + injectedText)
      
      // Auto-scroll to bottom after server text injection (like icebreakers)
      setTimeout(() => {
        autoScrollToBottom()
      }, 100) // Small delay to ensure DOM is updated
    })

    // File sharing event handlers
    socket.on('file-available', async (data) => {
      // Check if it's an image file
      const isImage = data.mimeType && data.mimeType.startsWith('image/')
      
      // Skip notifications for cached images (from session resume)
      const isCachedImage = data.isCached === true
      
      // Handle user's own uploads vs others' uploads differently
      const isOwnUpload = data.uploadedBy === socket.id
      
      if (isOwnUpload && !isCachedImage) {
        // Show success toast for own uploads (but not for cached images)
        showToast(`File "${data.filename}" uploaded successfully!`, 'success')
      } else if (!isOwnUpload && !isCachedImage) {
        // Add notification for other users' uploads (but not for cached images)
        setFileNotifications(prev => [...prev, {
          id: Date.now(),
          fileId: data.fileId,
          filename: data.filename,
          size: data.size,
          mimeType: data.mimeType,
          uploadedBy: data.uploadedBy,
          timestamp: data.timestamp,
          isImage
        }])
      }
      // Note: Cached images skip both toasts and notifications
      
      // Create image thumbnails for ALL images (including own uploads)
      if (isImage) {
        const imageData = await fetchImageData(data.fileId, data.filename, data.mimeType, data.cachedImageUrl)
        if (imageData) {
          // Use the username directly from the server (more reliable than client-side lookup)
          const senderName = data.uploaderUsername || 'Anonymous User'
          
          setSharedImages(prev => {
            // Check if image already exists to prevent duplicates (especially during reconnections)
            const imageExists = prev.some(img => img.fileId === data.fileId)
            if (imageExists) {
              console.log(`🔄 Skipping duplicate image: ${data.filename} (fileId: ${data.fileId})`)
              return prev // Return existing array without changes
            }
            
            // Add new image if it doesn't exist
            return [...prev, {
              id: data.fileId, // Use fileId as the unique identifier
              fileId: data.fileId,
              filename: data.filename,
              size: data.size,
              mimeType: data.mimeType,
              sender: senderName,
              timestamp: new Date(data.timestamp),
              data: imageData, // Base64 image data
              isCached: data.isCached || false // Flag to indicate cached images
            }]
          })
        }
      }
    })

    socket.on('file-share-accepted', (data) => {
      // Start chunked upload
      if (currentFileUpload.current) {
        startChunkedUpload(currentFileUpload.current, data.fileId, data.chunkSize)
      }
    })

    socket.on('file-share-error', (data) => {
      console.error('File share error:', data)
      showToast(data.message, 'error')
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentUploadFile(null)
      currentFileUpload.current = null
    })

    socket.on('file-upload-progress', (data) => {
      setUploadProgress(data.progress)
    })

    socket.on('file-upload-complete', (data) => {
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentUploadFile(null)
      currentFileUpload.current = null
      showToast(`File "${data.filename}" shared with session participants!`, 'success')
    })

    socket.on('file-downloaded', (data) => {
      showToast(`Someone downloaded "${data.filename}"`, 'info')
    })

    socket.on('file-expired', (data) => {
      setFileNotifications(prev => prev.filter(notif => notif.fileId !== data.fileId))
      // Also remove from shared images if it was an image
      setSharedImages(prev => prev.filter(img => img.fileId !== data.fileId))
      showToast('A shared file has expired', 'warning')
    })

    // Handle cached image deletion
    socket.on('cached-image-deleted', (data) => {
      console.log('Cached image deleted:', data)
      // Remove from shared images
      setSharedImages(prev => prev.filter(img => img.fileId !== data.fileId))
      showToast(`Image "${data.filename}" was deleted from cache`, 'info')
    })

    // Handle direct AI responses (for silent icebreaker injection)
    socket.on('ai-response-direct', (data) => {
      if (data.requestId && data.requestId.startsWith('icebreaker-') && data.response) {
        // Stop the timer audio when icebreaker response is received
        audioManager.stop('timer')
        
        // Silently inject the AI response into the document
        const aiResponse = data.response.trim()
        const insertPosition = icebreakerCursorPositionRef.current // Get from ref
        const targetEditorMode = icebreakerEditorModeRef.current // Get from ref
        
        // Icebreakers should always go to live document (collaborative area)
        setDocument(prevDocument => {
          let newDocument
          
          if (insertPosition !== null && insertPosition >= 0) {
            // Insert at the stored cursor position
            const beforeCursor = prevDocument.substring(0, insertPosition)
            const afterCursor = prevDocument.substring(insertPosition)
            
            // Add appropriate spacing
            const spacing = beforeCursor.length > 0 && !beforeCursor.endsWith('\n') ? '\n\n' : ''
            const endSpacing = afterCursor.length > 0 && !afterCursor.startsWith('\n') ? '\n\n' : ''
            
            newDocument = beforeCursor + spacing + aiResponse + endSpacing + afterCursor
          } else {
            // Fallback to appending at the end (original behavior)
            const injection = prevDocument.length > 0 ? `\n\n${aiResponse}` : aiResponse
            newDocument = prevDocument + injection
          }
          
          // Always broadcast icebreakers to other users (since they're collaborative content)
          socket.emit('document-change', {
            sessionId: sessionId,
            document: newDocument
          })
          
          return newDocument
        })
        
        // Clear the stored state after use
        icebreakerCursorPositionRef.current = null
        icebreakerEditorModeRef.current = null
        
        // Focus and position cursor after the inserted text
        setTimeout(() => {
          // Always focus the live textarea after icebreaker insertion
          const activeTextarea = textareaRef.current
          
          if (activeTextarea && insertPosition !== null && insertPosition >= 0) {
            // Calculate the spacing that was added before the response
            const beforeText = activeTextarea.value.substring(0, insertPosition)
            const spacing = beforeText.length > 0 && !beforeText.endsWith('\n') ? '\n\n' : ''
            const newCursorPosition = insertPosition + spacing.length + aiResponse.length
            
            activeTextarea.selectionStart = activeTextarea.selectionEnd = newCursorPosition
            activeTextarea.focus()
          } else {
            // Fallback to auto-scroll to bottom (original behavior)
            autoScrollToBottom()
          }
        }, 100) // Small delay to ensure DOM is updated
      }
    })

    // Handle document limit exceeded from server
    socket.on('document-limit-exceeded', (data) => {
      console.warn('Document limit exceeded:', data)
      showToast(`Document limit exceeded: ${data.limit.toLocaleString()} characters maximum`, 'error')
      
      // Revert document to previous state or truncate
      setDocument(prev => prev.substring(0, data.limit))
    })

    // Handle shared audio playback
    socket.on('play-audio', (data) => {
      // Only play audio for other users, not the person who triggered it
      if (data.username !== userIdentity.username) {
        playSharedAudio(data.audioKey, data.username)
      }
    })

    // Game-related socket events
    socket.on('word-selection', (data) => {
      console.log('Received word choices:', data.wordChoices)
      setWordChoices(data.wordChoices)
      setShowWordSelection(true)
    })

    socket.on('game-started', (data) => {
      setGameActive(true)
      setShowGameModal(true)
      setShowWordSelection(false) // Hide word selection modal
      setGameState({
        drawer: data.drawer,
        word: data.word,
        timeLeft: data.timeLeft || 90,
        guesses: [],
        isCorrectGuess: false,
        winner: null
      })
      // No toast notification for game start - modal provides all information
    })

    socket.on('game-ended', (data) => {
      setGameState(prev => ({
        ...prev,
        winner: data.winner, // Keep for backward compatibility
        winners: data.winners || [],
        correctWord: data.correctWord || prev.word,
        isCorrectGuess: !!(data.winners && data.winners.length > 0)
      }))
      
      // No toast notifications for game end - all information shown in modal
      // Keep the modal open so users can see who won
      // Modal visibility is controlled separately from gameActive
      // Users must manually close it by clicking the X button
    })

    socket.on('game-guess', (data) => {
      setGameState(prev => ({
        ...prev,
        guesses: [...prev.guesses, data]
      }))
    })

    socket.on('game-timer-update', (data) => {
      setGameState(prev => ({
        ...prev,
        timeLeft: data.timeLeft
      }))
    })

    socket.on('current-game-state', (data) => {
      // Handle receiving current game state when joining a session with active game
      console.log('Received current game state:', data)
      setGameActive(true)
      setShowGameModal(true)
      setGameState({
        drawer: data.drawer,
        word: data.word,
        timeLeft: data.timeLeft,
        guesses: data.guesses || [],
        isCorrectGuess: false,
        winner: null
      })
      // No toast notification for joining game - modal shows all necessary information
    })

    socket.on('game-status-change', (data) => {
      // Handle game status changes to enable/disable game button for all users
      console.log('Game status change:', data)
      setGameActive(data.gameActive)
    })

    socket.on('drawing-update', (data) => {
      // This will be handled by the DrawingGame component through socket prop
      // No need to store drawing data in App state
    })

    socketRef.current = socket
  }

  const handleDocumentChange = (e) => {
    const newDocument = e.target.value
    setDocument(newDocument)
    
    // Update user activity timestamp when user types
    updateUserActivity()
    
    if (socketRef.current && isConnected) {
      socketRef.current.emit('document-change', {
        sessionId,
        document: newDocument
      })
    }
  }

  // Random Icebreaker Handler
  const handleRandomIcebreaker = (specificTopic = null) => {
    // Check if button is on cooldown
    if (randomCooldown > 0) {
      return
    }
    
    if (socketRef.current && isConnected && sessionId) {
      // Start 15-second cooldown
      setRandomCooldown(15)
      
      // Clear any existing timer
      if (randomCooldownTimer) {
        clearInterval(randomCooldownTimer)
      }
      
      // Start countdown timer
      const timer = setInterval(() => {
        setRandomCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setRandomCooldownTimer(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      setRandomCooldownTimer(timer)
      
      // Capture cursor position for icebreaker insertion
      // Always insert into live document, but use cursor position intelligently
      const liveTextarea = textareaRef.current
      const draftTextarea = draftRef.current
      
      icebreakerEditorModeRef.current = 'live' // Force icebreakers to go to live mode
      
      if (liveTextarea) {
        let targetCursorPos
        
        if (editorMode === 'live') {
          // User is in live mode - use their current cursor position
          targetCursorPos = liveTextarea.selectionStart
        } else {
          // User is in draft mode - insert at the end of live document
          // This makes sense because icebreakers are meant to add new collaborative content
          targetCursorPos = liveTextarea.value.length
        }
        
        icebreakerCursorPositionRef.current = targetCursorPos
      } else {
        // Fallback to end of document if no textarea reference
        icebreakerCursorPositionRef.current = null
      }
      
      // Use specific topic if provided, otherwise get a random one
      const selectedTopic = specificTopic || getRandomTopic()
      
      // Create the AI prompt
      const prompt = createIcebreakerPrompt(selectedTopic)
      
      // Start playing the timer audio in loop
      audioManager.play('timer', {
        loop: true,
        volume: config.audioVolume || 0.8
      })
      
      // Send the prompt to the socket server for AI processing (silent mode)
      socketRef.current.emit('ask-ai-direct', {
        sessionId: sessionId,
        selectedText: prompt,
        requestId: `icebreaker-${Date.now()}` // Unique ID to track this request
      })
    } else {
      console.warn('Not connected to session - cannot generate icebreaker')
    }
  }

  const shareSession = () => {
    setShowQRModal(true)
  }

  const getCurrentUrl = () => {
    return `${window.location.origin}${window.location.pathname}#${sessionId}`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCurrentUrl())
    showToast('Link copied to clipboard!')
  }

  const leaveSession = () => {
    // Emit leave-session event before disconnecting for cleaner handling
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-session')
    }
    
    setDocument('') // Clear document when leaving session
    // Note: Keep draft content in localStorage so user can continue later
    setEditorMode('live') // Reset to live mode
    setIsInSession(false)
    setSessionId('')
    setConnectedUsers([]) // Clear user list when leaving
    setFloatingIcons([]) // Clear any floating icons
    setRecentAudioTriggers(new Map()) // Clear audio trigger debouncing
    window.location.hash = ''
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
  }

  const clearDraft = () => {
    setDraftContent('')
    localStorage.removeItem('collabrio-draft-content')
    showToast('Draft cleared!')
  }

  const handleSetAsBackground = (image) => {
    // Create background image data URL from the base64 data
    const backgroundImageUrl = `data:${image.mimeType};base64,${image.data}`
    setBackgroundImage(backgroundImageUrl)
    
    // Emit background image change to other users in the session
    if (socketRef.current && sessionId) {
      socketRef.current.emit('background-image-change', {
        sessionId: sessionId,
        backgroundImage: backgroundImageUrl,
        filename: image.filename
      })
    }
    
    showToast(`"${image.filename}" set as background for all users!`, 'success')
  }

  const handleClearBackground = () => {
    setBackgroundImage(null)
    showToast('Background cleared!', 'success')
  }

  const handleDraftChange = (e) => {
    setDraftContent(e.target.value)
    
    // Update user activity timestamp when user types in draft
    updateUserActivity()
  }

  const addDraftToLive = () => {
    if (draftContent.trim()) {
      const newContent = document + (document ? '\n\n' : '') + draftContent
      setDocument(newContent)
      
      // Send the updated document to other users
      if (socketRef.current && isConnected) {
        socketRef.current.emit('document-change', {
          sessionId,
          document: newContent
        })
      }
      
      // Clear draft and switch to live mode
      setDraftContent('')
      localStorage.removeItem('collabrio-draft-content')
      setEditorMode('live')
      showToast('Draft content added to live document!')
    }
  }

  const copyDraftContent = () => {
    navigator.clipboard.writeText(draftContent)
    showToast('Draft content copied to clipboard!')
  }

  // File sharing functions
  const handleFileShare = async (file) => {
    if (!socketRef.current || !isConnected) {
      showToast('Not connected to session', 'error')
      return
    }

    if (!sessionId) {
      showToast('No active session found', 'error')
      return
    }

    // Validate file size using server configuration
    if (file.size > serverConfig.maxFileSize) {
      showToast(`File too large. Maximum size is ${serverConfig.maxFileSizeMB}MB.`, 'error')
      return
    }


    
    setIsUploading(true)
    setUploadProgress(0)
    setCurrentUploadFile(file)
    currentFileUpload.current = file

    // Request file share from server with session validation
    socketRef.current.emit('file-share-request', {
      filename: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      sessionId: sessionId // Explicitly include sessionId for validation
    })
  }

  const startChunkedUpload = (file, fileId, chunkSize) => {
    const reader = new FileReader()
    let offset = 0
    let chunkIndex = 0
    const totalChunks = Math.ceil(file.size / chunkSize)

    const readSlice = () => {
      if (offset >= file.size) {
        return
      }

      const slice = file.slice(offset, offset + chunkSize)
      reader.readAsArrayBuffer(slice)
    }

    reader.onload = (e) => {
      const arrayBuffer = e.target.result
      const uint8Array = new Uint8Array(arrayBuffer)
      const base64String = btoa(String.fromCharCode.apply(null, uint8Array))
      
      const isLastChunk = offset + chunkSize >= file.size
      
      socketRef.current.emit('file-chunk', {
        fileId: fileId,
        chunkIndex: chunkIndex,
        chunkData: base64String,
        isLastChunk: isLastChunk
      })

      offset += chunkSize
      chunkIndex++

      if (!isLastChunk) {
        // Continue reading next chunk
        setTimeout(readSlice, 10) // Small delay to prevent overwhelming
      }
    }

    reader.onerror = (error) => {
      console.error('File read error:', error)
      showToast('File read error occurred', 'error')
      setIsUploading(false)
      setUploadProgress(0)
    }

    // Start reading
    readSlice()
  }

  const handleFileDownload = async (fileId, onProgress) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('File download not available in this environment')
      }

      const downloadUrl = `${config.socketServerUrl}/download-file/${fileId}?sessionId=${sessionId}`
      
      // Create a temporary anchor element for download
      const link = window.document.createElement('a')
      link.href = downloadUrl
      link.download = '' // Let browser determine filename from headers
      link.style.display = 'none' // Hide the link
      
      // Add to DOM, click, then remove
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      
      showToast('File download started!', 'success')
      
      // Remove notification after download
      setFileNotifications(prev => prev.filter(notif => notif.fileId !== fileId))
      // Also remove from shared images if it was an image
      setSharedImages(prev => prev.filter(img => img.fileId !== fileId))
      
    } catch (error) {
      console.error('Download error:', error)
      showToast('Download failed: ' + error.message, 'error')
    }
  }

  const fetchImageData = async (fileId, filename, mimeType, cachedImageUrl = null) => {
    try {
      // Use cached image URL if available, otherwise use regular download endpoint
      const downloadUrl = cachedImageUrl 
        ? `${config.socketServerUrl}${cachedImageUrl}`
        : `${config.socketServerUrl}/download-file/${fileId}?sessionId=${sessionId}`
      
      const response = await fetch(downloadUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64Data = reader.result.split(',')[1] // Remove data:image/...;base64, prefix
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error fetching image data:', error)
      return null
    }
  }

  const dismissFileNotification = (fileId) => {
    setFileNotifications(prev => prev.filter(notif => notif.fileId !== fileId))
    // Note: Don't remove shared image thumbnails when dismissing notifications
    // Thumbnails should remain visible until file expires, is downloaded, or manually removed
  }

  const removeSharedImage = (imageId) => {
    setSharedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const deleteCachedImage = async (image) => {
    try {
      // Call the server to delete the cached image
      const response = await fetch(`${config.socketServerUrl}/cached-image/${sessionId}/${image.fileId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.status === 'success') {
        showToast(`Image "${result.filename}" deleted successfully`, 'success')
      } else {
        showToast(`Failed to delete image: ${result.message}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting cached image:', error)
      showToast('Failed to delete image from server', 'error')
    }
  }

  const startGame = () => {
    if (socketRef.current && isConnected && sessionId) {
      // Request word choices from server
      socketRef.current.emit('start-game', {
        sessionId,
        starter: userIdentity.username || generateFunnyUsername()
      })
    }
  }

  const selectWord = (selectedWord) => {
    if (socketRef.current && isConnected && sessionId) {
      // Send selected word to start the game
      socketRef.current.emit('select-word', {
        sessionId,
        starter: userIdentity.username || generateFunnyUsername(),
        selectedWord
      })
      setShowWordSelection(false)
    }
  }

  const cancelWordSelection = () => {
    setShowWordSelection(false)
    setWordChoices([])
  }

  const cancelUpload = () => {
    setIsUploading(false)
    setUploadProgress(0)
    setCurrentUploadFile(null)
    currentFileUpload.current = null
    showToast('Upload cancelled', 'warning')
  }

  // Render landing page or collaborative editor
  if (!isInSession) {
    return (
      <>
        <LandingPage 
          darkTheme={darkTheme}
          createNewSession={createNewSession}
          joinExistingSession={joinExistingSession}
        />
        
        {showSchoolAuthModal && (
          <SchoolAuthModal 
            onAuthComplete={handleSchoolAuthComplete}
            onCancel={handleSchoolAuthCancel}
          />
        )}

        <IdentityModal
          isVisible={showIdentityModal}
          onComplete={handleIdentityComplete}
          onSkip={handleIdentitySkip}
          existingUsername={userIdentity.username}
          existingAvatar={userIdentity.avatar}
          takenAvatars={connectedUsers.map(user => user.avatar).filter(Boolean)}
          takenUsernames={connectedUsers.map(user => user.username).filter(Boolean)}
          isFirstTime={true}
        />

        {/* Floating Audio Icons */}
        {floatingIcons.map((icon) => (
          <FloatingIcon
            key={icon.id}
            id={icon.id}
            emoji={icon.emoji}
            username={icon.username}
            onComplete={removeFloatingIcon}
          />
        ))}
      </>
    )
  }

  return (
    <div className={`collabrio-app ${darkTheme ? 'dark-theme' : ''}`}>
      <div className="collabrio-container">
        <Header 
          isConnected={isConnected}
          connectedUsers={connectedUsers}
          currentUserId={currentUserId}
          schoolName={getSessionSchoolNames()}
          onInsertUsername={insertTextAtCursor}
        />

        <Toolbar 
          shareSession={shareSession}
          darkTheme={darkTheme}
          setDarkTheme={setDarkTheme}
          sessionId={sessionId}
          leaveSession={leaveSession}
          onFileShare={handleFileShare}
          onRandomIcebreaker={handleRandomIcebreaker}
          isConnected={isConnected}
          randomCooldown={randomCooldown}
          onPlayAudio={handlePlayAudio}
          sharedImages={sharedImages}
          onRemoveImage={removeSharedImage}
          onDeleteCachedImage={deleteCachedImage}
          onSetAsBackground={handleSetAsBackground}
          editorMode={editorMode}
          onStartGame={startGame}
          gameActive={gameActive}
        />

        <Editor 
          textareaRef={textareaRef}
          draftRef={draftRef}
          sessionId={sessionId}
          document={document}
          draftContent={draftContent}
          editorMode={editorMode}
          setEditorMode={setEditorMode}
          handleDocumentChange={handleDocumentChange}
          handleDraftChange={handleDraftChange}
          addDraftToLive={addDraftToLive}
          copyDraftContent={copyDraftContent}
          clearDraft={clearDraft}
          backgroundImage={backgroundImage}
          showToast={showToast}
          socket={socketRef.current}
          updateUserActivity={updateUserActivity}
          onClearBackground={handleClearBackground}
        />

        <ShareModal 
          showQRModal={showQRModal}
          setShowQRModal={setShowQRModal}
          getCurrentUrl={getCurrentUrl}
          copyToClipboard={copyToClipboard}
        />

        {/* File Notifications */}
        {fileNotifications.length > 0 && (
          <div className="file-notifications-container">
            {fileNotifications.map((notification) => (
              <FileNotification
                key={notification.id}
                notification={notification}
                onDownload={handleFileDownload}
                onDismiss={dismissFileNotification}
                darkTheme={darkTheme}
              />
            ))}
          </div>
        )}

        {/* Upload Progress */}
        <UploadProgress
          isUploading={isUploading}
          filename={currentUploadFile?.name}
          progress={uploadProgress}
          onCancel={cancelUpload}
          darkTheme={darkTheme}
        />

        <Toast toast={toast} />
        
        <IdentityModal
          isVisible={showIdentityModal}
          onComplete={handleIdentityComplete}
          onSkip={handleIdentitySkip}
          existingUsername={userIdentity.username}
          existingAvatar={userIdentity.avatar}
          takenAvatars={connectedUsers.map(user => user.avatar).filter(Boolean)}
          takenUsernames={connectedUsers.map(user => user.username).filter(Boolean)}
          isFirstTime={true}
        />
        
        <Footer connectionType={connectionType} sessionId={sessionId} />
      </div>

      {/* Guess the Sketch Game */}
      {showGameModal && (
        <DrawingGame
          gameState={gameState}
          socket={socketRef.current}
          sessionId={sessionId}
          currentUser={userIdentity.username || generateFunnyUsername()}
          onClose={() => {
            setShowGameModal(false)
            
            // Notify server that this user closed their game modal
            if (socketRef.current && sessionId) {
              socketRef.current.emit('close-game-modal', {
                sessionId: sessionId,
                user: userIdentity.username || generateFunnyUsername()
              })
            }
            
            // Reset game state when closing modal (only affects this user)
            setGameState({
              drawer: null,
              word: '',
              timeLeft: 60,
              guesses: [],
              isCorrectGuess: false,
              winner: null,
              winners: [],
              correctWord: ''
            })
            // gameActive is controlled by server game-status-change events
            // No server communication needed - modal close only affects individual user
          }}
        />
      )}

      {/* Word Selection Modal */}
      {showWordSelection && (
        <WordSelection
          wordChoices={wordChoices}
          currentUser={userIdentity.username || generateFunnyUsername()}
          onSelectWord={selectWord}
          onCancel={cancelWordSelection}
        />
      )}

      {/* Floating Audio Icons */}
      {floatingIcons.map((icon) => (
        <FloatingIcon
          key={icon.id}
          id={icon.id}
          emoji={icon.emoji}
          username={icon.username}
          onComplete={removeFloatingIcon}
        />
      ))}
    </div>
  )
}

export default App
