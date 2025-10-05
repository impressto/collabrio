import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import QRCode from 'react-qr-code'
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
  
  // Refs
  const socketRef = useRef(null)
  const textareaRef = useRef(null)

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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const createNewSession = () => {
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    setIsInSession(true)
    window.location.hash = newSessionId
  }

  const joinExistingSession = (sessionIdToJoin) => {
    setSessionId(sessionIdToJoin)
    setIsInSession(true)
    window.location.hash = sessionIdToJoin
  }

  const connectToSocket = () => {
    // Try to connect to the socket server (local for development)
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('Connected to socket server')
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
      <div className="clippy-container">
        <div className="landing-page">
          <header className="landing-header">
            <h1>📎 Clippy</h1>
            <p>Real-time collaborative text editor</p>
          </header>
          
          <div className="landing-content">
            <div className="session-actions">
              <button onClick={createNewSession} className="create-session-button">
                ✨ Create New Session
              </button>
              
              <div className="join-session-section">
                <p>or join an existing session:</p>
                <input
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
            
            <div className="landing-features">
              <h3>Features:</h3>
              <ul>
                <li>✅ Real-time collaborative editing</li>
                <li>✅ Anonymous sessions - no signup required</li>
                <li>✅ QR code sharing for mobile devices</li>
                <li>✅ Works on desktop and mobile browsers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="clippy-container">
      <header className="clippy-header">
        <h1>📎 Clippy</h1>
        <div className="connection-info">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="connection-type">({connectionType})</span>
          <span className="users">👥 {connectedUsers.length} user(s)</span>
        </div>
      </header>

      <div className="toolbar">
        <button onClick={shareSession} className="share-button">
          📱 Share Session
        </button>
        <button onClick={copyToClipboard} className="copy-button">
          📋 Copy Link
        </button>
        <button 
          onClick={() => {
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
        <span className="session-id">Session: {sessionId}</span>
      </div>

      <main className="editor-container">
        <textarea
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
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Share This Session</h3>
            <div className="qr-container">
              <QRCode
                size={200}
                value={getCurrentUrl()}
                viewBox="0 0 256 256"
              />
            </div>
            <p>Scan this QR code or share the link:</p>
            <input
              type="text"
              value={getCurrentUrl()}
              readOnly
              className="share-link"
              onClick={(e) => e.target.select()}
            />
            <div className="modal-buttons">
              <button onClick={copyToClipboard}>Copy Link</button>
              <button onClick={() => setShowQRModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
