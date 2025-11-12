import React, { useState, useRef, useEffect } from 'react'

function DrawingGame({ 
  gameState, 
  socket,
  sessionId,
  currentUser, 
  onClose
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [guess, setGuess] = useState('')
  const [guessesRemaining, setGuessesRemaining] = useState(3)
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 })
  
  const isDrawer = gameState?.drawer === currentUser
  const hasGameEnded = gameState?.winner !== null || gameState?.timeLeft <= 0
  const correctGuess = gameState?.isCorrectGuess

  // Drawing data to sync with other clients
  const [drawingPaths, setDrawingPaths] = useState([])
  const [currentPath, setCurrentPath] = useState([])

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

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e) => {
    if (!isDrawer || hasGameEnded) return
    
    console.log('🎨 [DRAW] Starting to draw')
    setIsDrawing(true)
    const point = getCanvasPoint(e)
    setCurrentPath([point])
    setLastPoint(point)
    console.log('🎨 [DRAW] Start point:', point)
  }

  const draw = (e) => {
    if (!isDrawing || !isDrawer || hasGameEnded) return
    
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

  const stopDrawing = () => {
    if (!isDrawing || !isDrawer) return
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

  const submitGuess = (e) => {
    e.preventDefault()
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
              {gameState.winner ? (
                <p><strong>{gameState.winner}</strong> guessed it correctly: <strong>{gameState.word}</strong></p>
              ) : (
                <p>Time's up! The word was: <strong>{gameState.word}</strong></p>
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
                  <span className="time-remaining">Time: {formatTime(gameState.timeLeft || 0)}</span>
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
            style={{ 
              cursor: isDrawer && !hasGameEnded ? 'crosshair' : 'default',
              pointerEvents: hasGameEnded ? 'none' : 'auto'
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
              <div key={index} className={`guess-item ${guessData.correct ? 'correct-guess' : ''}`}>
                <strong>{guessData.username}:</strong> {guessData.guess}
                {guessData.correct && <span className="correct-indicator"> ✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrawingGame