import React, { useState, useRef, useEffect, useCallback } from 'react'

const GAME_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 600,
  frogSize: 20,
  frogSpeed: 40, // pixels per move
  lanes: [
    // Road section (bottom to middle)
    { y: 520, direction: 1, speed: 2, type: 'car', color: '#ff0000' },
    { y: 480, direction: -1, speed: 3, type: 'truck', color: '#0066cc' },
    { y: 440, direction: 1, speed: 2.5, type: 'car', color: '#ffaa00' },
    { y: 400, direction: -1, speed: 1.5, type: 'truck', color: '#00cc66' },
    // Safe zone (middle)
    { y: 360, direction: 0, speed: 0, type: 'safe', color: '#90EE90' },
    // River section (middle to top)
    { y: 320, direction: 1, speed: 1.8, type: 'log', color: '#8B4513' },
    { y: 280, direction: -1, speed: 2.2, type: 'turtle', color: '#228B22' },
    { y: 240, direction: 1, speed: 1.5, type: 'log', color: '#8B4513' },
    { y: 200, direction: -1, speed: 2.8, type: 'turtle', color: '#228B22' },
    { y: 160, direction: 1, speed: 2, type: 'log', color: '#8B4513' },
  ],
  startY: 560,
  goalY: 120,
  timeLimit: 120, // 2 minutes
  maxLives: 3
}

const FROG_COLORS = [
  '#00ff00', '#ff6b6b', '#4ecdc4', '#45b7d1', 
  '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7',
  '#a29bfe', '#fd79a8', '#e84393', '#00b894'
]

function FroggerGame({ 
  gameState, 
  socket,
  sessionId,
  currentUser, 
  sessionUsers,
  onClose
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [localGameState, setLocalGameState] = useState({
    players: {},
    obstacles: [],
    timeLeft: GAME_CONFIG.timeLimit,
    gameEnded: false,
    winners: [],
    leaderboard: []
  })
  
  // Player state
  const [playerPosition, setPlayerPosition] = useState({
    x: GAME_CONFIG.canvasWidth / 2,
    y: GAME_CONFIG.startY
  })
  const [lives, setLives] = useState(GAME_CONFIG.maxLives)
  const [score, setScore] = useState(0)
  const [isOnLog, setIsOnLog] = useState(false)
  const [logSpeed, setLogSpeed] = useState(0)

  // Get player color based on index in session
  const getPlayerColor = useCallback((username) => {
    const userIndex = sessionUsers.findIndex(user => user.username === username)
    return FROG_COLORS[userIndex % FROG_COLORS.length]
  }, [sessionUsers])

  // Initialize obstacles
  const initializeObstacles = useCallback(() => {
    const obstacles = []
    
    GAME_CONFIG.lanes.forEach((lane, laneIndex) => {
      if (lane.type === 'safe') return
      
      const obstacleCount = lane.type === 'truck' ? 2 : 3
      const spacing = GAME_CONFIG.canvasWidth / obstacleCount
      
      for (let i = 0; i < obstacleCount; i++) {
        obstacles.push({
          id: `${laneIndex}-${i}`,
          x: (i * spacing) + (Math.random() * spacing * 0.5),
          y: lane.y,
          width: lane.type === 'truck' ? 80 : lane.type === 'log' ? 100 : 60,
          height: 30,
          speed: lane.speed * lane.direction,
          type: lane.type,
          color: lane.color,
          laneIndex
        })
      }
    })
    
    return obstacles
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleFroggerUpdate = (data) => {
      setLocalGameState(prev => ({
        ...prev,
        players: data.players,
        timeLeft: data.timeLeft
      }))
    }

    const handleFroggerGameEnd = (data) => {
      setLocalGameState(prev => ({
        ...prev,
        gameEnded: true,
        winners: data.winners,
        leaderboard: data.leaderboard
      }))
    }

    const handleFroggerPlayerMove = (data) => {
      setLocalGameState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [data.player]: data.position
        }
      }))
    }

    socket.on('frogger-update', handleFroggerUpdate)
    socket.on('frogger-game-end', handleFroggerGameEnd)
    socket.on('frogger-player-move', handleFroggerPlayerMove)

    return () => {
      socket.off('frogger-update', handleFroggerUpdate)
      socket.off('frogger-game-end', handleFroggerGameEnd)
      socket.off('frogger-player-move', handleFroggerPlayerMove)
    }
  }, [socket])

  // Movement handler
  const movePlayer = useCallback((direction) => {
    if (localGameState.gameEnded || lives <= 0) return

    setPlayerPosition(prev => {
      let newX = prev.x
      let newY = prev.y
      
      switch (direction) {
        case 'up':
          newY = Math.max(GAME_CONFIG.goalY, prev.y - GAME_CONFIG.frogSpeed)
          break
        case 'down':
          newY = Math.min(GAME_CONFIG.startY, prev.y + GAME_CONFIG.frogSpeed)
          break
        case 'left':
          newX = Math.max(0, prev.x - GAME_CONFIG.frogSpeed)
          break
        case 'right':
          newX = Math.min(GAME_CONFIG.canvasWidth - GAME_CONFIG.frogSize, prev.x + GAME_CONFIG.frogSpeed)
          break
      }
      
      const newPosition = { x: newX, y: newY }
      
      // Update score for forward progress
      if (direction === 'up' && newY < prev.y) {
        setScore(s => s + 10)
      }
      
      // Check for goal
      if (newY <= GAME_CONFIG.goalY) {
        setScore(s => s + 200)
        // Reset position for next round
        setTimeout(() => {
          setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
        }, 500)
      }
      
      // Emit movement to other players
      if (socket) {
        socket.emit('frogger-move', {
          sessionId,
          player: currentUser,
          position: newPosition,
          score,
          lives
        })
      }
      
      return newPosition
    })
  }, [localGameState.gameEnded, lives, socket, sessionId, currentUser, score])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          movePlayer('up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          movePlayer('down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          movePlayer('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          movePlayer('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePlayer])

  // Collision detection
  const checkCollisions = useCallback(() => {
    if (localGameState.gameEnded) return

    let onLog = false
    let currentLogSpeed = 0

    localGameState.obstacles.forEach(obstacle => {
      const frogLeft = playerPosition.x
      const frogRight = playerPosition.x + GAME_CONFIG.frogSize
      const frogTop = playerPosition.y
      const frogBottom = playerPosition.y + GAME_CONFIG.frogSize
      
      const obstacleLeft = obstacle.x
      const obstacleRight = obstacle.x + obstacle.width
      const obstacleTop = obstacle.y
      const obstacleBottom = obstacle.y + obstacle.height

      const collision = frogRight > obstacleLeft && 
                       frogLeft < obstacleRight && 
                       frogBottom > obstacleTop && 
                       frogTop < obstacleBottom

      if (collision) {
        if (obstacle.type === 'car' || obstacle.type === 'truck') {
          // Hit by vehicle - lose life
          setLives(prev => {
            const newLives = prev - 1
            if (newLives <= 0) {
              // Game over for this player
              if (socket) {
                socket.emit('frogger-player-died', {
                  sessionId,
                  player: currentUser,
                  finalScore: score
                })
              }
            }
            return newLives
          })
          // Reset position
          setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
        } else if (obstacle.type === 'log' || obstacle.type === 'turtle') {
          // On a log/turtle - move with it
          onLog = true
          currentLogSpeed = obstacle.speed
        }
      }
    })

    // Check if in river without log/turtle
    const playerLane = GAME_CONFIG.lanes.find(lane => 
      Math.abs(lane.y - playerPosition.y) < GAME_CONFIG.frogSize
    )
    
    if (playerLane && (playerLane.type === 'log' || playerLane.type === 'turtle') && !onLog) {
      // In water without log - drown
      setLives(prev => {
        const newLives = prev - 1
        if (newLives <= 0 && socket) {
          socket.emit('frogger-player-died', {
            sessionId,
            player: currentUser,
            finalScore: score
          })
        }
        return newLives
      })
      setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
    }

    setIsOnLog(onLog)
    setLogSpeed(currentLogSpeed)
  }, [localGameState.obstacles, localGameState.gameEnded, playerPosition, socket, sessionId, currentUser, score])

  // Move player with log if on one
  useEffect(() => {
    if (isOnLog && logSpeed !== 0) {
      setPlayerPosition(prev => ({
        ...prev,
        x: Math.max(0, Math.min(GAME_CONFIG.canvasWidth - GAME_CONFIG.frogSize, prev.x + logSpeed))
      }))
    }
  }, [isOnLog, logSpeed])

  // Game loop
  useEffect(() => {
    if (!gameStarted) return

    const gameLoop = () => {
      // Update obstacles
      setLocalGameState(prev => ({
        ...prev,
        obstacles: prev.obstacles.map(obstacle => ({
          ...obstacle,
          x: obstacle.x + obstacle.speed
        })).map(obstacle => {
          // Wrap around screen
          if (obstacle.speed > 0 && obstacle.x > GAME_CONFIG.canvasWidth) {
            obstacle.x = -obstacle.width
          } else if (obstacle.speed < 0 && obstacle.x < -obstacle.width) {
            obstacle.x = GAME_CONFIG.canvasWidth
          }
          return obstacle
        })
      }))

      checkCollisions()
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameStarted, checkCollisions])

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = '#87CEEB' // Sky blue
    ctx.fillRect(0, 0, canvas.width, GAME_CONFIG.goalY)
    
    ctx.fillStyle = '#90EE90' // Light green for safe zones
    ctx.fillRect(0, GAME_CONFIG.goalY, canvas.width, 40)
    ctx.fillRect(0, 360, canvas.width, 40)
    ctx.fillRect(0, 560, canvas.width, 40)

    ctx.fillStyle = '#4169E1' // Blue for river
    ctx.fillRect(0, 160, canvas.width, 200)

    ctx.fillStyle = '#696969' // Gray for road
    ctx.fillRect(0, 400, canvas.width, 160)

    // Draw lane dividers
    ctx.strokeStyle = '#FFFF00'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    for (let i = 420; i < 560; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // Draw obstacles
    localGameState.obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.color
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
      
      // Add simple details based on type
      if (obstacle.type === 'car') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 10, 8)
        ctx.fillRect(obstacle.x + obstacle.width - 15, obstacle.y + 5, 10, 8)
      } else if (obstacle.type === 'log') {
        ctx.strokeStyle = '#654321'
        ctx.lineWidth = 2
        for (let i = 0; i < obstacle.width; i += 20) {
          ctx.beginPath()
          ctx.arc(obstacle.x + i + 10, obstacle.y + 15, 3, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    })

    // Draw all players
    Object.entries(localGameState.players).forEach(([username, playerData]) => {
      const color = getPlayerColor(username)
      const isCurrentPlayer = username === currentUser
      
      ctx.fillStyle = color
      ctx.fillRect(playerData.x, playerData.y, GAME_CONFIG.frogSize, GAME_CONFIG.frogSize)
      
      // Add player indicator
      if (isCurrentPlayer) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.strokeRect(playerData.x - 2, playerData.y - 2, GAME_CONFIG.frogSize + 4, GAME_CONFIG.frogSize + 4)
      }
      
      // Draw username
      ctx.fillStyle = '#000000'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(username, playerData.x + GAME_CONFIG.frogSize/2, playerData.y - 5)
    })

    // Draw current player (always on top)
    const playerColor = getPlayerColor(currentUser)
    ctx.fillStyle = playerColor
    ctx.fillRect(playerPosition.x, playerPosition.y, GAME_CONFIG.frogSize, GAME_CONFIG.frogSize)
    
    // Player border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeRect(playerPosition.x - 2, playerPosition.y - 2, GAME_CONFIG.frogSize + 4, GAME_CONFIG.frogSize + 4)

    // Draw username
    ctx.fillStyle = '#000000'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(currentUser, playerPosition.x + GAME_CONFIG.frogSize/2, playerPosition.y - 5)

    // Draw goal area
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(0, GAME_CONFIG.goalY - 40, canvas.width, 40)
    ctx.fillStyle = '#000000'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🏁 GOAL 🏁', canvas.width / 2, GAME_CONFIG.goalY - 15)

  }, [localGameState, playerPosition, currentUser, getPlayerColor])

  // Render loop
  useEffect(() => {
    if (!gameStarted) return
    
    const renderLoop = () => {
      draw()
      requestAnimationFrame(renderLoop)
    }
    
    requestAnimationFrame(renderLoop)
  }, [gameStarted, draw])

  // Start game handler
  const handleStartGame = () => {
    setGameStarted(true)
    const obstacles = initializeObstacles()
    setLocalGameState(prev => ({
      ...prev,
      obstacles,
      players: { [currentUser]: playerPosition }
    }))
    
    if (socket) {
      socket.emit('frogger-start', {
        sessionId,
        player: currentUser,
        position: playerPosition
      })
    }
  }

  if (localGameState.gameEnded) {
    return (
      <div className="drawing-game-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="drawing-game-modal">
          <div className="game-header">
            <h3>🐸 Frogger - Game Over!</h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="game-results">
            <h4>🏆 Final Scores:</h4>
            <div className="leaderboard">
              {localGameState.leaderboard.map((player, index) => (
                <div key={player.username} className={`leaderboard-entry ${index === 0 ? 'winner' : ''}`}>
                  <span className="rank">#{index + 1}</span>
                  <span className="player-name">{player.username}</span>
                  <span className="player-score">{player.score} points</span>
                </div>
              ))}
            </div>
            
            {localGameState.winners.length > 0 && (
              <div className="winners">
                <h4>🎉 Winners: {localGameState.winners.join(', ')}</h4>
              </div>
            )}
          </div>
          
          <button className="start-game-btn" onClick={onClose}>
            Close Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="drawing-game-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="frogger-game-modal">
        <div className="game-header">
          <h3>🐸 Frogger - Multiplayer</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {!gameStarted ? (
          <div className="game-lobby">
            <div className="game-instructions">
              <h4>How to Play:</h4>
              <ul>
                <li>Use arrow keys or WASD to move your frog</li>
                <li>Cross roads safely - avoid cars and trucks!</li>
                <li>Jump on logs and turtles to cross the river</li>
                <li>Don't fall in the water!</li>
                <li>Reach the goal to score points</li>
                <li>You have {GAME_CONFIG.maxLives} lives</li>
              </ul>
              
              <div className="player-list">
                <h4>Players ({sessionUsers.length}):</h4>
                {sessionUsers.map(user => (
                  <div key={user.username} className="player-item">
                    <div 
                      className="player-color" 
                      style={{ backgroundColor: getPlayerColor(user.username) }}
                    ></div>
                    <span>{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="start-game-btn" onClick={handleStartGame}>
              🐸 Start Frogger Game
            </button>
          </div>
        ) : (
          <div className="game-area">
            <div className="game-stats">
              <div className="stat">Score: {score}</div>
              <div className="stat">Lives: {'❤️'.repeat(Math.max(0, lives))}</div>
              <div className="stat">Time: {Math.max(0, localGameState.timeLeft)}s</div>
              <div className="stat">Players: {Object.keys(localGameState.players).length}</div>
            </div>
            
            <canvas
              ref={canvasRef}
              width={GAME_CONFIG.canvasWidth}
              height={GAME_CONFIG.canvasHeight}
              className="frogger-canvas"
            />
            
            <div className="controls-help">
              <p>Use Arrow Keys or WASD to move • Avoid vehicles • Jump on logs/turtles • Reach the goal!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FroggerGame