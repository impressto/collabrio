import React, { useState, useEffect, useRef } from 'react'
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
import Footer from './components/Footer'
import IdentityModal from './components/IdentityModal'
import SchoolAuthModal from './components/SchoolAuthModal'
import FloatingIcon from './components/FloatingIcon'
import ImageThumbnail from './components/ImageThumbnail'

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

  // Identity state
  const [userIdentity, setUserIdentity] = useState(() => {
    const stored = getStoredIdentity()
    return stored || { username: '', avatar: '' }
  })
  const [showIdentityModal, setShowIdentityModal] = useState(false)
  const [pendingSessionAction, setPendingSessionAction] = useState(null) // 'create' or 'join'
  const [currentUserId, setCurrentUserId] = useState('')
  
  // Refs
  const socketRef = useRef(null)
  const textareaRef = useRef(null)
  const draftRef = useRef(null)
  const currentFileUpload = useRef(null)

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('collabrio-dark-theme', JSON.stringify(darkTheme))
  }, [darkTheme])

  // Save draft content to localStorage
  useEffect(() => {
    localStorage.setItem('collabrio-draft-content', draftContent)
  }, [draftContent])

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
    })

    // File sharing event handlers
    socket.on('file-available', async (data) => {
      // Don't show notification if this user uploaded the file
      if (data.uploadedBy === socket.id) {
        showToast(`File "${data.filename}" uploaded successfully!`, 'success')
        return
      }
      
      // Check if it's an image file
      const isImage = data.mimeType && data.mimeType.startsWith('image/')
      
      // Add notification for other users
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
      
      // If it's an image, also fetch the data for thumbnail display
      if (isImage) {
        const imageData = await fetchImageData(data.fileId, data.filename, data.mimeType)
        if (imageData) {
          // Use the username directly from the server (more reliable than client-side lookup)
          const senderName = data.uploaderUsername || 'Anonymous User'
          
          setSharedImages(prev => [...prev, {
            id: data.fileId, // Use fileId as the unique identifier
            fileId: data.fileId,
            filename: data.filename,
            size: data.size,
            mimeType: data.mimeType,
            sender: senderName,
            timestamp: new Date(data.timestamp),
            data: imageData // Base64 image data
          }])
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

    // Handle direct AI responses (for silent icebreaker injection)
    socket.on('ai-response-direct', (data) => {
      if (data.requestId && data.requestId.startsWith('icebreaker-') && data.response) {
        // Silently inject the AI response into the document
        const aiResponse = data.response.trim()
        
        // Use callback to get the most current document state
        setDocument(prevDocument => {
          const injection = prevDocument.length > 0 ? `\n\n${aiResponse}` : aiResponse
          const newDocument = prevDocument + injection
          
          // Broadcast the change to other users
          socket.emit('document-change', {
            sessionId: sessionId,
            document: newDocument
          })
          
          return newDocument
        })
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

    socketRef.current = socket
  }

  const handleDocumentChange = (e) => {
    const newDocument = e.target.value
    setDocument(newDocument)
    
    if (socketRef.current && isConnected) {
      socketRef.current.emit('document-change', {
        sessionId,
        document: newDocument
      })
    }
  }

  // Random Icebreaker Handler
  const handleRandomIcebreaker = () => {
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
      
      // Get a random topic from our predefined array
      const randomTopic = getRandomTopic()
      
      // Create the AI prompt
      const prompt = createIcebreakerPrompt(randomTopic)
      
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

  const handleDraftChange = (e) => {
    setDraftContent(e.target.value)
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

    // Validate file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      showToast('File too large. Maximum size is 10MB.', 'error')
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

  const fetchImageData = async (fileId, filename, mimeType) => {
    try {
      const downloadUrl = `${config.socketServerUrl}/download-file/${fileId}?sessionId=${sessionId}`
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
          showToast={showToast}
          socket={socketRef.current}
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
