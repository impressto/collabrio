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
  
  // Refs
  const socketRef = useRef(null)
  const textareaRef = useRef(null)

  // Initialize session from URL hash or generate new one
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash) {
      setSessionId(hash)
    } else {
      const newSessionId = generateSessionId()
      setSessionId(newSessionId)
      window.location.hash = newSessionId
    }
  }, [])

  // Connect to socket when sessionId is available
  useEffect(() => {
    if (sessionId && !socketRef.current) {
      connectToSocket()
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [sessionId])

  // Debug: Log when document state changes
  useEffect(() => {
    console.log('Document state changed to:', document)
  }, [document])

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
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
        <input
          type="text"
          placeholder="Enter session ID to join..."
          className="session-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const newSessionId = e.target.value.trim()
              if (newSessionId) {
                setSessionId(newSessionId)
                window.location.hash = newSessionId
                window.location.reload()
              }
            }
          }}
        />
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
