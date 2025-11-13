import React, { useState, useRef, useEffect } from 'react'

function DrawingGame({ 
  gameState, 
  socket,
  sessionId,
  currentUser, 
  sessionUsers,
  onClose
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [guess, setGuess] = useState('')
  const [guessesRemaining, setGuessesRemaining] = useState(3)
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 })
  const [showAssignmentOptions, setShowAssignmentOptions] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  
  const isDrawer = gameState?.drawer === currentUser
  const isOriginalDrawer = gameState?.originalDrawer === currentUser
  const canAssignNext = gameState?.canAssignNext && isOriginalDrawer
  const correctGuess = gameState?.isCorrectGuess

  // Drawing data to sync with other clients
  const [drawingPaths, setDrawingPaths] = useState([])
  const [currentPath, setCurrentPath] = useState([])
  
  // Client-side timer fallback
  const [clientTimer, setClientTimer] = useState(gameState?.timeLeft || 60)
  const timerRef = useRef(null)
  const lastServerUpdateRef = useRef(Date.now())

  // Use client timer or server timer (whichever is available)
  const displayTimer = gameState?.timeLeft !== undefined ? gameState.timeLeft : clientTimer
  const hasGameEnded = gameState?.winner !== null || displayTimer <= 0

  // Set up canvas drawing
  useEffect(() => {
    console.log('🎨 [CANVAS EFFECT] Canvas setup effect triggered, gameState:', gameState)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#000000'
    
    // Only clear canvas on initial setup or if explicitly needed
    console.log('🎨 [CANVAS EFFECT] Clearing canvas for initial setup')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add passive touch event listeners to prevent default scrolling behavior
    const preventTouchDefault = (e) => e.preventDefault()
    
    canvas.addEventListener('touchstart', preventTouchDefault, { passive: false })
    canvas.addEventListener('touchmove', preventTouchDefault, { passive: false })
    canvas.addEventListener('touchend', preventTouchDefault, { passive: false })
    
    return () => {
      canvas.removeEventListener('touchstart', preventTouchDefault)
      canvas.removeEventListener('touchmove', preventTouchDefault)
      canvas.removeEventListener('touchend', preventTouchDefault)
    }
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleDrawingUpdate = (data) => {
      console.log('🎨 [RECEIVE] Drawing update received:', data)
      
      if (!canvasRef.current || isDrawer) {
        console.log('🎨 [RECEIVE] Ignoring update - no canvas or is drawer')
        return // Don't update if we're the drawer
      }
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      // Set drawing style for received updates
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = '#000000'
      
      // Apply the drawing data
      if (data.drawingData) {
        if (data.drawingData.clear || data.drawingData.type === 'clear') {
          console.log('🎨 [RECEIVE] Clearing canvas')
          // Clear the canvas
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          setDrawingPaths([])
        } else if (data.drawingData.type === 'draw_line') {
          console.log('🎨 [RECEIVE] Drawing line from', data.drawingData.from, 'to', data.drawingData.to)
          // Draw the line segment directly without clearing the canvas
          ctx.beginPath()
          ctx.moveTo(data.drawingData.from.x, data.drawingData.from.y)
          ctx.lineTo(data.drawingData.to.x, data.drawingData.to.y)
          ctx.stroke()
        } else if (data.drawingData.type === 'full_sync' && data.drawingData.paths) {
          console.log('🎨 [RECEIVE] Full sync - redrawing complete drawing with', data.drawingData.paths.length, 'paths')
          // Store the paths in local state
          setDrawingPaths(data.drawingData.paths)
          // Redraw the complete canvas
          redrawCanvas(ctx, data.drawingData.paths)
        } else if (data.drawingData.paths) {
          console.log('🎨 [RECEIVE] Redrawing with', data.drawingData.paths.length, 'paths')
          console.log('🎨 [RECEIVE] Canvas dimensions:', canvas.width, 'x', canvas.height)
          console.log('🎨 [RECEIVE] About to call redrawCanvas...')
          // Store the paths in local state to prevent loss
          setDrawingPaths(data.drawingData.paths)
          // Redraw the canvas based on the drawing data
          redrawCanvas(ctx, data.drawingData.paths)
          console.log('🎨 [RECEIVE] Redraw complete')
        }
      } else {
        console.warn('🎨 [RECEIVE] No drawingData in update')
      }
    }

    socket.on('drawing-update', handleDrawingUpdate)

    return () => {
      socket.off('drawing-update', handleDrawingUpdate)
    }
  }, [socket, isDrawer])

  // Reset guesses when a new game starts
  useEffect(() => {
    if (gameState?.drawer && gameState?.word) {
      setGuessesRemaining(3)
    }
  }, [gameState?.drawer, gameState?.word])

  // Client-side timer effect
  useEffect(() => {
    if (gameState?.status === 'drawing') {
      // Start client-side timer
      timerRef.current = setInterval(() => {
        setClientTimer(prev => Math.max(0, prev - 1))
      }, 1000)
    } else {
      // Clear timer when not in drawing phase
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState?.status])

  // Sync client timer with server updates
  useEffect(() => {
    if (gameState?.timeLeft !== undefined) {
      setClientTimer(gameState.timeLeft)
      lastServerUpdateRef.current = Date.now()
    }
  }, [gameState?.timeLeft])

  // Redraw canvas function
  const redrawCanvas = (ctx, paths) => {
    console.log('🎨 [REDRAW] Starting redraw with', paths?.length, 'paths')
    if (!ctx || !paths) {
      console.warn('🎨 [REDRAW] Missing ctx or paths')
      return
    }
    
    // Clear canvas
    console.log('🎨 [REDRAW] Clearing canvas before redraw')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    
    // Set drawing style
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#000000'
    
    // Redraw all the paths
    let drawnPaths = 0
    paths.forEach((path, pathIndex) => {
      if (path.length > 1) {
        console.log('🎨 [REDRAW] Drawing path', pathIndex, 'with', path.length, 'points:', path.slice(0, 3), '...')
        ctx.beginPath()
        ctx.moveTo(path[0].x, path[0].y)
        path.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
        drawnPaths++
      } else {
        console.log('🎨 [REDRAW] Skipping path', pathIndex, 'with only', path.length, 'points')
      }
    })
    console.log('🎨 [REDRAW] Completed redraw, drew', drawnPaths, 'paths')
    
    // Add a timeout to check if canvas gets cleared after redraw
    setTimeout(() => {
      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
      const isBlank = imageData.data.every((pixel, index) => index % 4 === 3 || pixel === 255)
      console.log('🎨 [REDRAW] Canvas status 100ms after redraw:', isBlank ? 'BLANK' : 'HAS CONTENT')
    }, 100)
  }

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Handle both mouse and touch events
    let clientX, clientY
    if (e.touches && e.touches.length > 0) {
      // Touch event
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      // Touch end event
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e) => {
    if (!isDrawer || hasGameEnded) return
    
    // Prevent default touch behavior to avoid scrolling/zooming
    e.preventDefault()
    
    console.log('🎨 [DRAW] Starting to draw')
    setIsDrawing(true)
    const point = getCanvasPoint(e)
    setCurrentPath([point])
    setLastPoint(point)
    console.log('🎨 [DRAW] Start point:', point)
  }

  const draw = (e) => {
    if (!isDrawing || !isDrawer || hasGameEnded) return
    
    // Prevent default touch behavior to avoid scrolling/zooming
    e.preventDefault()
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const point = getCanvasPoint(e)
    
    console.log('🎨 [DRAW] Drawing from', lastPoint, 'to', point)
    
    // Draw line from last point to current point
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    
    // Add point to current path
    const newPath = [...currentPath, point]
    setCurrentPath(newPath)
    setLastPoint(point)
    
    console.log('🎨 [DRAW] Current path length:', newPath.length, 'Total paths:', drawingPaths.length)
    
    // Send incremental drawing update to other players (just the line segment)
    if (socket && sessionId) {
      console.log('🎨 [EMIT] Sending incremental drawing-update to server')
      socket.emit('drawing-update', {
        sessionId,
        drawingData: {
          type: 'draw_line',
          from: lastPoint,
          to: point
        }
      })
    } else {
      console.warn('🎨 [WARN] Cannot emit drawing-update: socket or sessionId missing')
    }
  }

  const stopDrawing = (e) => {
    if (!isDrawing || !isDrawer) return
    
    // Prevent default touch behavior if it's a touch event
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    
    console.log('🎨 [DRAW] Stopping draw, finalizing path with', currentPath.length, 'points')
    setIsDrawing(false)
    
    // Add current path to drawing paths
    if (currentPath.length > 0) {
      setDrawingPaths(prev => {
        const newPaths = [...prev, currentPath]
        console.log('🎨 [DRAW] Total paths after stop:', newPaths.length)
        
        // Send complete drawing state after finishing a stroke (for synchronization)
        if (socket && sessionId) {
          console.log('🎨 [SYNC] Sending complete drawing state after stroke completion')
          socket.emit('drawing-update', {
            sessionId,
            drawingData: {
              type: 'full_sync',
              paths: newPaths
            }
          })
        }
        
        return newPaths
      })
      setCurrentPath([])
    }
  }

  const clearCanvas = () => {
    if (!isDrawer || hasGameEnded) return
    
    console.log('🎨 [CLEAR] Clearing canvas and sending clear signal')
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Clear drawing data
    setDrawingPaths([])
    setCurrentPath([])
    
    // Send clear update to other players
    if (socket && sessionId) {
      console.log('🎨 [CLEAR] Emitting clear signal to server')
      socket.emit('drawing-update', {
        sessionId,
        drawingData: {
          type: 'clear',
          clear: true
        }
      })
    }
  }

    const assignGameMaster = () => {
    if (!selectedUser || !socket || !sessionId) return
    
    socket.emit('assign-game-master', {
      sessionId: sessionId,
      assigner: currentUser,
      newGameMaster: selectedUser
    })
    
    setShowAssignmentOptions(false)
    setSelectedUser('')
  }

  const skipAssignment = () => {
    if (!socket || !sessionId) return
    
    socket.emit('skip-assignment', {
      sessionId: sessionId,
      user: currentUser
    })
    
    setShowAssignmentOptions(false)
  }

  const submitGuess = () => {
    if (!guess.trim() || guessesRemaining <= 0 || isDrawer || hasGameEnded) return
    
    setGuessesRemaining(prev => prev - 1)
    
    // Send guess to server
    if (socket && sessionId) {
      socket.emit('game-guess', {
        sessionId,
        guess: guess.trim(),
        username: currentUser
      })
    }
    
    setGuess('')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!gameState) return null

  return (
    <div className="drawing-game-overlay" onClick={(e) => e.target.classList.contains('drawing-game-overlay') && onClose()}>
      <div className="drawing-game-modal">
        <div className="drawing-game-header">
          <h3>🎨 Guess the Sketch</h3>
          <button className="close-game-btn" onClick={onClose}>✕</button>
        </div>

        <div className="game-info">
          {hasGameEnded ? (
            <div className="game-result">
              <h4>🎉 Game Over!</h4>
              {gameState.winners && gameState.winners.length > 0 ? (
                <div>
                  <p><strong>Correct guessers:</strong></p>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    {gameState.winners.map((winner, index) => (
                      <li key={index}><strong>{winner}</strong></li>
                    ))}
                  </ul>
                  <p>The word was: <strong>{gameState.correctWord || gameState.word}</strong></p>
                </div>
              ) : (
                <p>Time's up! The word was: <strong>{gameState.correctWord || gameState.word}</strong></p>
              )}
              
              {canAssignNext && !showAssignmentOptions && (
                <div className="assignment-prompt">
                  <p style={{ margin: '1rem 0 0.5rem', color: '#0066cc' }}>
                    <strong>Want to keep playing?</strong>
                  </p>
                  <button 
                    className="assign-master-btn"
                    onClick={() => setShowAssignmentOptions(true)}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginRight: '8px'
                    }}
                  >
                    Assign Next Game Master
                  </button>
                  <button 
                    className="skip-assignment-btn"
                    onClick={skipAssignment}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    End Game
                  </button>
                </div>
              )}

              {showAssignmentOptions && canAssignNext && (
                <div className="assignment-selection">
                  <p style={{ margin: '1rem 0 0.5rem', fontWeight: 'bold' }}>
                    Choose the next game master:
                  </p>
                  <select 
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    style={{
                      padding: '8px',
                      marginRight: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select a user...</option>
                    {sessionUsers?.filter(user => user.username !== currentUser).map((user, index) => (
                      <option key={index} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={assignGameMaster}
                    disabled={!selectedUser}
                    style={{
                      background: selectedUser ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: selectedUser ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      marginRight: '8px'
                    }}
                  >
                    Assign
                  </button>
                  <button 
                    onClick={() => setShowAssignmentOptions(false)}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="game-status">
                <p>
                  <strong>Drawer:</strong> {gameState.drawer || 'Unknown'} • {' '}
                  {isDrawer ? (
                    <span className="drawing-word">Draw: <strong>{gameState.word}</strong></span>
                  ) : (
                    <span>Guess what {gameState.drawer} is drawing!</span>
                  )} • {' '}
                  <span className="time-remaining">Time: {formatTime(displayTimer || 0)}</span>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="drawing-canvas-container">
          <canvas
            ref={canvasRef}
            width={550}
            height={413}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ 
              cursor: isDrawer && !hasGameEnded ? 'crosshair' : 'default',
              pointerEvents: hasGameEnded ? 'none' : 'auto',
              touchAction: 'none' // Prevent scrolling and zooming on touch
            }}
          />
          
          {isDrawer && !hasGameEnded && (
            <div className="drawing-controls">
              <button onClick={clearCanvas} className="clear-canvas-btn">
                🗑️ Clear
              </button>
            </div>
          )}
        </div>

        {!isDrawer && !hasGameEnded && (
          <div className="guessing-area">
            <form onSubmit={submitGuess} className="guess-form">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={guessesRemaining > 0 ? "Enter your guess..." : "No guesses remaining"}
                className="guess-input"
                disabled={guessesRemaining <= 0}
              />
              <button 
                type="submit" 
                className="guess-submit-btn"
                disabled={!guess.trim() || guessesRemaining <= 0}
              >
                {guessesRemaining <= 0 ? 'No Guesses Left' : `Guess (${guessesRemaining} left)`}
              </button>
            </form>
          </div>
        )}

        <div className="game-guesses">
          <h4>Guesses:</h4>
          <div className="guesses-list">
            {gameState.guesses?.map((guessData, index) => (
              <div key={index} className={`guess-item ${guessData.isCorrect ? 'correct-guess' : ''}`}>
                <strong>{guessData.username}:</strong> {guessData.guess}
                {guessData.isCorrect && <span className="correct-indicator"> ✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrawingGame