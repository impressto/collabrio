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
  
  // Refs
  const socketRef = useRef(null)
  const textareaRef = useRef(null)

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('collabrio-dark-theme', JSON.stringify(darkTheme))
  }, [darkTheme])

  // Toast functionality
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  // Initialize session from URL hash only (no auto-generation)
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash) {
      setSessionId(hash)
      setIsInSession(true)
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
    const newSessionId = generateSessionId()
    setDocument('') // Clear document for new session
    setSessionId(newSessionId)
    setIsInSession(true)
    window.location.hash = newSessionId
  }

  const joinExistingSession = (sessionIdToJoin) => {
    setDocument('') // Clear document when joining different session
    setSessionId(sessionIdToJoin)
    setIsInSession(true)
    window.location.hash = sessionIdToJoin
  }

  const connectToSocket = () => {
    // Connect to the socket server using configuration
    const socket = io(config.socketServerUrl, {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log(`Connected to socket server at ${config.socketServerUrl}`)
      setIsConnected(true)
      socket.emit('join-session', { sessionId })
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
    setIsInSession(false)
    setSessionId('')
    window.location.hash = ''
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
  }

  // Render landing page or collaborative editor
  if (!isInSession) {
    return (
      <LandingPage 
        darkTheme={darkTheme}
        createNewSession={createNewSession}
        joinExistingSession={joinExistingSession}
      />
    )
  }

  return (
    <div className={`collabrio-app ${darkTheme ? 'dark-theme' : ''}`}>
      <div className="collabrio-container">
        <Header 
          isConnected={isConnected}
          connectionType={connectionType}
          connectedUsers={connectedUsers}
        />

        <Toolbar 
          shareSession={shareSession}
          darkTheme={darkTheme}
          setDarkTheme={setDarkTheme}
          sessionId={sessionId}
          leaveSession={leaveSession}
        />

        <Editor 
          textareaRef={textareaRef}
          sessionId={sessionId}
          document={document}
          handleDocumentChange={handleDocumentChange}
          showToast={showToast}
        />

        <ShareModal 
          showQRModal={showQRModal}
          setShowQRModal={setShowQRModal}
          getCurrentUrl={getCurrentUrl}
          copyToClipboard={copyToClipboard}
        />

        <Toast toast={toast} />
      </div>
    </div>
  )
}

export default App
