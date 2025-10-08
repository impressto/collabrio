import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import QRCode from 'react-qr-code'
import config from './config.js'
import './App.css'

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
  
  // Refs
  const socketRef = useRef(null)
  const textareaRef = useRef(null)

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('collabrio-dark-theme', JSON.stringify(darkTheme))
  }, [darkTheme])

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
    alert('Link copied to clipboard!')
  }

  // Render landing page or collaborative editor
  if (!isInSession) {
    return (
    <div className={`collabrio-app ${darkTheme ? 'dark-theme' : ''}`}>
      <div className="collabrio-container">
        <div className="landing-page">
          <header className="landing-header">
            <h1><img src="./client/public/collaborio.png" alt="Collabrio" style={{width: '40px', height: '40px', marginRight: '12px', verticalAlign: 'middle'}} />Collabrio</h1>
            <p>Real-time collaborative text editor</p>
          </header>
          
          <div className="landing-content">
            <div className="session-actions">
              <button id="create-session-btn" onClick={createNewSession} className="create-session-button">
                ✨ Create New Session
              </button>
              
              <div className="join-session-section">
                <p>or join an existing session:</p>
                <input
                  id="join-session-input"
                  type="text"
                  placeholder="Enter session ID..."
                  className="join-session-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const sessionIdToJoin = e.target.value.trim()
                      if (sessionIdToJoin) {
                        joinExistingSession(sessionIdToJoin)
                      }
                    }
                  }}
                />
              </div>
            </div>
  
          </div>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className={`collabrio-app ${darkTheme ? 'dark-theme' : ''}`}>
      <div className="collabrio-container">
      <header className="collabrio-header">
        <h1><img src="./client/public/collaborio.png" alt="Collabrio" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />Collabrio</h1>
        <div className="connection-info">
          <span id="connection-status" className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span id="connection-type-display" className="connection-type">({connectionType})</span>
          <span id="user-count-display" className="users">👥 {connectedUsers.length} user(s)</span>
        </div>
      </header>

      <div className="toolbar">
        <button id="share-session-btn" onClick={shareSession} className="share-button">
          📱 Share Session
        </button>
        <button id="copy-link-btn" onClick={copyToClipboard} className="copy-button">
          📋 Copy Link
        </button>
        <button id="theme-toggle-btn" onClick={() => setDarkTheme(!darkTheme)} className="theme-toggle-button">
          {darkTheme ? '☀️ Light' : '🌙 Dark'}
        </button>
        <button 
          id="leave-session-btn"
          onClick={() => {
            setDocument('') // Clear document when leaving session
            setIsInSession(false)
            setSessionId('')
            window.location.hash = ''
            if (socketRef.current) {
              socketRef.current.disconnect()
            }
          }}
          className="leave-session-button"
        >
          🚪 Leave Session
        </button>
        <span id="session-id-display" className="session-id">Session: {sessionId}</span>
      </div>

      <main className="editor-container">
        <textarea
          id="collaborative-editor"
          ref={textareaRef}
          key={`textarea-${sessionId}`}
          value={document}
          onChange={handleDocumentChange}
          placeholder="Start typing your collaborative document here..."
          className="collaborative-editor"
        />
      </main>

      {/* QR Code Modal */}
      {showQRModal && (
        <div id="qr-modal-overlay" className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div id="qr-modal-content" className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Share This Session</h3>
            <div className="qr-container">
              <QRCode
                id="qr-code"
                size={200}
                value={getCurrentUrl()}
                viewBox="0 0 256 256"
              />
            </div>
            <p>Scan this QR code or share the link:</p>
            <input
              id="share-link-input"
              type="text"
              value={getCurrentUrl()}
              readOnly
              className="share-link"
              onClick={(e) => e.target.select()}
            />
            <div className="modal-buttons">
              <button id="modal-copy-btn" onClick={copyToClipboard}>Copy Link</button>
              <button id="modal-close-btn" onClick={() => setShowQRModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

export default App
