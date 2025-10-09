import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import config from './config.js'
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

// Utilities
import { 
  getStoredIdentity, 
  saveIdentity, 
  hasValidStoredIdentity,
  generateFunnyUsername
} from './utils/identityUtils'

// Avatar options (same as in IdentityModal)
const AVATAR_OPTIONS = [
  '🐱', '🐶', '🐺', '🦊', '🐸', '🐢', '🦉', '🐧', '🐘', '🦁',
  '⚡', '🌟', '🎯', '🎨', '🚀', '🎸', '⚽', '🎭', '🎲', '⭐',
  '🌺', '🌲', '🍄', '🌙', '☀️', '🌊', '🔥', '❄️', '🌈', '🍀'
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

  // Initialize session from URL hash - prompt for identity first
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash) {
      // Show identity modal for URL-based session joining
      setPendingSessionAction({ action: 'join', sessionId: hash })
      setShowIdentityModal(true)
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

  // Debug: Log when document state changes
  useEffect(() => {
    console.log('Document state changed to:', document)
  }, [document])

  const generateSessionId = () => {
    // Generate a simple 6-character session ID
    // Using base36 (0-9, a-z) for URL-friendly characters
    return Math.random().toString(36).substring(2, 8)
  }

  const createNewSession = () => {
    // Always show identity modal for session creation
    setPendingSessionAction('create')
    setShowIdentityModal(true)
  }

  const joinExistingSession = (sessionIdToJoin) => {
    // Always show identity modal for session joining
    setPendingSessionAction({ action: 'join', sessionId: sessionIdToJoin })
    setShowIdentityModal(true)
  }

  // Identity handling functions
  const handleIdentityComplete = (identity) => {
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
      
      // Include user identity when joining session
      const identity = userIdentity.username ? userIdentity : getStoredIdentity()
      socket.emit('join-session', { 
        sessionId, 
        clientId: socket.id,
        userIdentity: {
          username: identity?.username || generateFunnyUsername(),
          avatar: identity?.avatar || AVATAR_OPTIONS[0]
        }
      })
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server')
      setIsConnected(false)
    })

    socket.on('document-update', (data) => {
      console.log('Received document-update:', data)
      console.log('Current document state:', document)
      setDocument(data.document)
    })

    socket.on('user-joined', (data) => {
      console.log('User joined:', data)
      setConnectedUsers(data.users)
    })

    socket.on('user-left', (data) => {
      console.log('User left:', data)
      setConnectedUsers(data.users)
    })

    socket.on('server-text-injection', (data) => {
      console.log('Server text injection:', data)
      
      // Insert server text into the document with formatting
      const injectedText = `\n\n[${data.type.toUpperCase()}] ${data.text}\n\n`
      setDocument(prevDoc => prevDoc + injectedText)
    })

    // File sharing event handlers
    socket.on('file-available', (data) => {
      console.log('File available:', data)
      
      // Don't show notification if this user uploaded the file
      if (data.uploadedBy === socket.id) {
        showToast(`File "${data.filename}" uploaded successfully!`, 'success')
        return
      }
      
      // Add notification for other users
      setFileNotifications(prev => [...prev, {
        id: Date.now(),
        fileId: data.fileId,
        filename: data.filename,
        size: data.size,
        mimeType: data.mimeType,
        uploadedBy: data.uploadedBy,
        timestamp: data.timestamp
      }])
    })

    socket.on('file-share-accepted', (data) => {
      console.log('File share accepted:', data)
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
      console.log('File upload complete:', data)
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentUploadFile(null)
      currentFileUpload.current = null
      showToast(`File "${data.filename}" shared with session participants!`, 'success')
    })

    socket.on('file-downloaded', (data) => {
      console.log('File downloaded:', data)
      showToast(`Someone downloaded "${data.filename}"`, 'info')
    })

    socket.on('file-expired', (data) => {
      console.log('File expired:', data)
      setFileNotifications(prev => prev.filter(notif => notif.fileId !== data.fileId))
      showToast('A shared file has expired', 'warning')
    })

    socketRef.current = socket
  }

  const handleDocumentChange = (e) => {
    const newDocument = e.target.value
    setDocument(newDocument)
    
    if (socketRef.current && isConnected) {
      console.log('Sending document-change:', { sessionId, document: newDocument })
      socketRef.current.emit('document-change', {
        sessionId,
        document: newDocument
      })
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
    setDocument('') // Clear document when leaving session
    // Note: Keep draft content in localStorage so user can continue later
    setEditorMode('live') // Reset to live mode
    setIsInSession(false)
    setSessionId('')
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

    console.log('Starting file share:', file.name, file.size, 'bytes', 'Session:', sessionId)
    
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
      
    } catch (error) {
      console.error('Download error:', error)
      showToast('Download failed: ' + error.message, 'error')
    }
  }

  const dismissFileNotification = (fileId) => {
    setFileNotifications(prev => prev.filter(notif => notif.fileId !== fileId))
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
        />

        <Toolbar 
          shareSession={shareSession}
          darkTheme={darkTheme}
          setDarkTheme={setDarkTheme}
          sessionId={sessionId}
          leaveSession={leaveSession}
          onFileShare={handleFileShare}
          isConnected={isConnected}
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
        
        <Footer connectionType={connectionType} />
      </div>
    </div>
  )
}

export default App
