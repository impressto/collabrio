import React, { useState, useRef, useEffect, useCallback } from 'react'

// Import base64 encoded sprites - no network loading required!
import { FROGGER_SPRITES, SPRITE_DIMENSIONS as IMPORTED_SPRITE_DIMENSIONS } from './FroggerSprites'

// Import audio manager for sound effects
import { audioManager } from '../utils/audioUtils'

// Base64 sprites imported successfully
console.log('🎨 Frogger sprites imported:', Object.keys(FROGGER_SPRITES || {}).length, 'sprites available')

// Use imported sprite dimensions and add fallbacks for missing sprites only
const SPRITE_DIMENSIONS = {
  ...IMPORTED_SPRITE_DIMENSIONS, // Use the imported dimensions from FroggerSprites.js
  
  // Fallback dimensions for sprites not yet available in base64 format
  'car-red': { width: 64, height: 32 },
  'turtle-surface': { width: 32, height: 32 },
  'turtle-diving': { width: 32, height: 32 },
  'turtle-diving1': { width: 32, height: 32 },
  'turtle-diving2': { width: 32, height: 32 },
  'turtle-diving3': { width: 32, height: 32 },
  'alligator-closed': { width: 80, height: 32 },
  'alligator-open': { width: 80, height: 32 },
  'grass-light': { width: 32, height: 32 },
  'grass-dark': { width: 32, height: 32 },
  'grass-goal': { width: 32, height: 32 },
  'road-asphalt': { width: 32, height: 32 },
  'road-line': { width: 32, height: 4 },
  'water-tile': { width: 32, height: 32 }
}

const GAME_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 600,
  frogSize: 32,      // Matches sprite size
  frogSpeed: 40,     // pixels per move
  lanes: [
    // Road section (bottom to middle) - using available truck and car sprites
    { y: 520, direction: 1, speed: 2, type: 'car', sprite: 'car-blue', color: '#0066cc' }, // Blue car (base64 sprite)
    { y: 480, direction: -1, speed: 3, type: 'truck', sprite: 'truck-orange', color: '#ff6600' }, // Orange truck (base64)
    { y: 440, direction: 1, speed: 2.5, type: 'car', sprite: 'car-yellow', color: '#ffaa00' }, // Yellow car (base64 sprite)
    { y: 400, direction: -1, speed: 1.5, type: 'truck', sprite: 'truck-green', color: '#00cc66' }, // Green truck (base64)
    // Safe zone (middle)
    { y: 360, direction: 0, speed: 0, type: 'safe', sprite: 'grass', color: '#90EE90' }, // Grass (base64 sprite)
    // River section (middle to top) - using log-medium and turtle sprites
    { y: 320, direction: 1, speed: 1.8, type: 'log', sprite: 'log-medium', color: '#8B4513' }, // Log (base64 sprite)
    { y: 280, direction: -1, speed: 2.2, type: 'turtle', sprite: 'turtle', color: '#228B22' }, // Turtle (base64 sprite)
    { y: 240, direction: 1, speed: 1.5, type: 'log', sprite: 'log-medium', color: '#8B4513' }, // Log (base64 sprite)
    { y: 200, direction: -1, speed: 2.8, type: 'turtle', sprite: 'turtle', color: '#228B22' }, // Turtle (base64 sprite)
    { y: 160, direction: 1, speed: 2, type: 'log', sprite: 'log-medium', color: '#8B4513' }, // Log (base64 sprite)
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
  /* gameState prop not used - Frogger manages its own state */
  socket,
  sessionId,
  currentUser, 
  sessionUsers,
  onClose
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const spriteImagesRef = useRef({})
  const timeoutsRef = useRef([]) // Track all timeouts for cleanup
  
  // Dynamic canvas sizing state
  const [canvasSize, setCanvasSize] = useState({
    width: GAME_CONFIG.canvasWidth,
    height: GAME_CONFIG.canvasHeight,
    scale: 1
  })
  
  // Calculate optimal canvas size based on screen dimensions
  const calculateCanvasSize = useCallback(() => {
    const maxWidth = Math.min(window.innerWidth * 0.9, 900) // Max 90% of screen width, max 900px
    const maxHeight = window.innerHeight * 0.7 // Max 70% of screen height
    
    const baseWidth = GAME_CONFIG.canvasWidth
    const baseHeight = GAME_CONFIG.canvasHeight
    const aspectRatio = baseWidth / baseHeight
    
    let newWidth, newHeight, scale
    
    // Calculate scale based on both width and height constraints
    const scaleByWidth = maxWidth / baseWidth
    const scaleByHeight = maxHeight / baseHeight
    scale = Math.min(scaleByWidth, scaleByHeight, 1) // Never scale up beyond original size
    
    newWidth = Math.floor(baseWidth * scale)
    newHeight = Math.floor(baseHeight * scale)
    
    return { width: newWidth, height: newHeight, scale }
  }, [])
  
  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const newSize = calculateCanvasSize()
      setCanvasSize(newSize)
    }
    
    updateCanvasSize() // Initial calculation
    window.addEventListener('resize', updateCanvasSize)
    
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [calculateCanvasSize])
  
  // Timeout management using refs to avoid circular dependencies
  
  const [gameStarted, setGameStarted] = useState(false)
  const [spritesLoaded, setSpritesLoaded] = useState({
    frog: false,
    vehicles: false,
    water: false,
    terrain: false
  })
  const [allSpritesLoaded, setAllSpritesLoaded] = useState(false)
  const [localGameState, setLocalGameState] = useState({
    obstacles: [],
    timeLeft: GAME_CONFIG.timeLimit,
    gameEnded: false,
    gameStartTime: null,
    leaderboard: []
  })
  const [playerDirection, setPlayerDirection] = useState('idle')
  
  // Player state
  const [playerPosition, setPlayerPosition] = useState({
    x: GAME_CONFIG.canvasWidth / 2,
    y: GAME_CONFIG.startY
  })
  const [lives, setLives] = useState(GAME_CONFIG.maxLives)
  const [score, setScore] = useState(0)
  const [isOnLog, setIsOnLog] = useState(false)
  const [logSpeed, setLogSpeed] = useState(0)
  const [isInvulnerable, setIsInvulnerable] = useState(false)
  const [difficulty, setDifficulty] = useState('normal') // easy, normal, hard

  // Calculate speed multiplier based on difficulty
  const getDifficultyMultiplier = () => {
    switch (difficulty) {
      case 'easy': return 0.5   // Half speed
      case 'normal': return 1.0 // Normal speed
      case 'hard': return 1.3   // 30% faster
      default: return 1.0
    }
  }

  // Initialize game state on component mount
  useEffect(() => {
    // Reset to initial state when component mounts
    setGameStarted(false)
    setDifficulty('normal') // Reset difficulty to normal on component mount
    setLocalGameState({
      obstacles: [],
      timeLeft: GAME_CONFIG.timeLimit,
      gameEnded: false,
      gameStartTime: null,
      leaderboard: []
    })
    setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
    setPlayerDirection('idle')
    setLives(GAME_CONFIG.maxLives)
    setScore(0)
    setIsOnLog(false)
    setLogSpeed(0)
    setIsInvulnerable(false)
    
    // Preload game audio files (paths relative to public directory)
    audioManager.preloadSound('hop', 'audio/hop.mp3')
    audioManager.preloadSound('splat', 'audio/splat.mp3') 
    audioManager.preloadSound('hooray', 'audio/hooray.mp3')
  }, [])

  // Load base64 sprites - instant loading, no network requests!
  useEffect(() => {
    const loadBase64Sprites = async () => {
      console.log('🎨 Loading base64 Frogger sprites - instant loading!')
      console.log('🎨 Available sprites:', Object.keys(FROGGER_SPRITES))
      
      // Create promises for all sprite loading
      const loadingPromises = Object.entries(FROGGER_SPRITES).map(([key, dataUri]) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            console.log(`✅ Base64 sprite loaded: ${key} (${img.width}x${img.height})`)
            spriteImagesRef.current[key] = img
            resolve(key)
          }
          img.onerror = (error) => {
            console.warn(`❌ Failed to load base64 sprite: ${key}`, error)
            reject(error)
          }
          img.src = dataUri
        })
      })
      
      try {
        // Wait for all sprites to load
        const loadedSprites = await Promise.allSettled(loadingPromises)
        const successCount = loadedSprites.filter(result => result.status === 'fulfilled').length
        
        console.log(`🎨 Sprite loading complete: ${successCount}/${loadingPromises.length} sprites loaded`)
        console.log('📋 Final loaded sprites:', Object.keys(spriteImagesRef.current))
        
        // Set loading states based on what we actually have
        const loadedSpriteKeys = Object.keys(spriteImagesRef.current)
        setSpritesLoaded({
          frog: loadedSpriteKeys.some(key => key.startsWith('frog-')),
          vehicles: loadedSpriteKeys.some(key => key.startsWith('truck-') || key.startsWith('car-')),
          water: loadedSpriteKeys.some(key => key.includes('log') || key.includes('turtle')),
          terrain: loadedSpriteKeys.some(key => key === 'grass' || key.includes('grass'))
        })
        
        // Enable enhanced graphics after sprites are loaded
        setAllSpritesLoaded(successCount > 0)
        
        console.log('✅ Base64 sprites loaded successfully!')
        console.log('🎮 Enhanced graphics enabled - no network loading required!')
        console.log('🔍 Sprite loading verification:')
        Object.keys(FROGGER_SPRITES).forEach(key => {
          console.log(`  ${key}: ${spriteImagesRef.current[key] ? '✅ loaded' : '❌ failed'}`)
        })
        
      } catch (error) {
        console.error('🚨 Error loading base64 sprites:', error)
        setAllSpritesLoaded(false)
      }
    }

    loadBase64Sprites()
  }, [])





  // Get player color based on index in session
  const getPlayerColor = useCallback((username) => {
    const userIndex = sessionUsers.findIndex(user => user.username === username)
    return FROG_COLORS[userIndex % FROG_COLORS.length]
  }, [sessionUsers])

  // Draw sprite image (base64 or fallback)
  const drawSprite = useCallback((ctx, spriteKey, x, y, width = null, height = null, tint = null) => {
    // Map frog direction keys to actual sprite keys
    let actualSpriteKey = spriteKey
    if (spriteKey === 'idle') actualSpriteKey = 'frog-idle'
    if (spriteKey === 'up') actualSpriteKey = 'frog-up'
    if (spriteKey === 'down') actualSpriteKey = 'frog-down'
    if (spriteKey === 'left') actualSpriteKey = 'frog-left'
    if (spriteKey === 'right') actualSpriteKey = 'frog-right'
    if (spriteKey === 'death') actualSpriteKey = 'squish' // Use squish sprite for death animation

    const spriteImage = spriteImagesRef.current[actualSpriteKey]
    
    // DEBUG: Log missing sprites for troubleshooting
    if (!spriteImage && (actualSpriteKey.startsWith('frog-') || actualSpriteKey.startsWith('truck-'))) {
      console.log(`🎨 MISSING SPRITE: "${spriteKey}" -> "${actualSpriteKey}" | Available:`, Object.keys(spriteImagesRef.current))
    }
    
    if (!spriteImage) {
      // Fallback to colored rectangle if sprite not loaded
      const dimensions = SPRITE_DIMENSIONS[actualSpriteKey] || SPRITE_DIMENSIONS[spriteKey] || { width: GAME_CONFIG.frogSize, height: GAME_CONFIG.frogSize }
      const fallbackWidth = width || dimensions.width
      const fallbackHeight = height || dimensions.height
      ctx.fillStyle = tint || '#00ff00'
      ctx.fillRect(x, y, fallbackWidth, fallbackHeight)
      return
    }

    // Get dimensions from config or use provided dimensions
    const dimensions = SPRITE_DIMENSIONS[actualSpriteKey] || SPRITE_DIMENSIONS[spriteKey] || { width: spriteImage.width, height: spriteImage.height }
    const drawWidth = width || dimensions.width
    const drawHeight = height || dimensions.height

    if (tint) {
      // Apply color tint by drawing the sprite with a color overlay
      ctx.save()
      
      // Draw the sprite normally first
      ctx.drawImage(spriteImage, x, y, drawWidth, drawHeight)
      
      // Apply color tint using composite operations
      ctx.globalCompositeOperation = 'source-atop'
      ctx.fillStyle = tint
      ctx.fillRect(x, y, drawWidth, drawHeight)
      
      ctx.restore()
    } else {
      // Draw sprite without tint
      ctx.drawImage(spriteImage, x, y, drawWidth, drawHeight)
    }
  }, [])

  // Initialize obstacles
  const initializeObstacles = useCallback(() => {
    const obstacles = []
    const speedMultiplier = getDifficultyMultiplier()
    
    GAME_CONFIG.lanes.forEach((lane, laneIndex) => {
      if (lane.type === 'safe') return
      
      const obstacleCount = lane.type === 'truck' ? 2 : 3
      const spacing = GAME_CONFIG.canvasWidth / obstacleCount
      
      for (let i = 0; i < obstacleCount; i++) {
        obstacles.push({
          id: `${laneIndex}-${i}`,
          x: (i * spacing) + (Math.random() * spacing * 0.5),
          y: lane.y,
          width: lane.type === 'truck' ? 80 : lane.type === 'log' ? 100 : lane.type === 'turtle' ? 32 : 60,
          height: 30,
          speed: lane.speed * lane.direction * speedMultiplier,
          type: lane.type,
          sprite: lane.sprite, // Add sprite key from config
          color: lane.color,
          laneIndex,
          // Add random animation offset for turtles to make diving more varied
          animationOffset: lane.type === 'turtle' ? Math.random() * 4800 : 0
        })
      }
    })
    
    return obstacles
  }, [difficulty])

  // Handle game end and score submission
  const handleGameEnd = useCallback((reason = 'completed') => {
    if (localGameState?.gameEnded) return

    console.log('🐸 [CLIENT] Game ended:', reason, 'Final score:', score)
    
    // Clear any pending timeouts when game ends
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    
    setLocalGameState(prev => ({ ...prev, gameEnded: true }))
    
    // Submit score to server
    if (socket && score > 0) {
      socket.emit('frogger-score-submit', {
        sessionId,
        player: currentUser,
        finalScore: score,
        timeLeft: localGameState?.timeLeft || 0,
        endReason: reason
      })
    }
  }, [socket, sessionId, currentUser, score, localGameState?.gameEnded, localGameState?.timeLeft])

  // Socket event listeners for leaderboard updates
  useEffect(() => {
    if (!socket) return

    const handleFroggerLeaderboardUpdate = (data) => {
      console.log('🐸 [CLIENT] Received leaderboard update:', data)
      setLocalGameState(prev => ({
        ...prev,
        leaderboard: data.leaderboard
      }))
    }

    const handleFroggerGameEnd = (data) => {
      console.log('🐸 [CLIENT] Game session ended:', data)
      // Individual games don't end globally anymore - just update leaderboard
      if (data.leaderboard) {
        setLocalGameState(prev => ({
          ...prev,
          leaderboard: data.leaderboard
        }))
      }
    }

    socket.on('frogger-leaderboard-update', handleFroggerLeaderboardUpdate)
    socket.on('frogger-session-end', handleFroggerGameEnd)

    return () => {
      socket.off('frogger-leaderboard-update', handleFroggerLeaderboardUpdate)
      socket.off('frogger-session-end', handleFroggerGameEnd)
    }
  }, [socket])

  // Local game timer
  useEffect(() => {
    if (!gameStarted || localGameState?.gameEnded) return

    const timer = setInterval(() => {
      setLocalGameState(prev => {
        if (!prev) return prev
        const newTimeLeft = Math.max(0, (prev.timeLeft || 0) - 1)
        if (newTimeLeft === 0) {
          // Game time up - submit final score
          handleGameEnd('timeup')
        }
        return { ...prev, timeLeft: newTimeLeft }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, localGameState?.gameEnded, handleGameEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts directly
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Movement handler
  const movePlayer = useCallback((direction) => {
    if (localGameState.gameEnded || lives <= 0) return
    
    // Prevent movement during death animation or invulnerability period
    if (playerDirection === 'death' || isInvulnerable) return

    // Play hop sound for movement
    audioManager.play('hop')

    // Update player direction for animation
    setPlayerDirection(direction)

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
        // Play success sound
        audioManager.play('hooray')
        // Reset position for next round
        const timeoutId = setTimeout(() => {
          setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
          setPlayerDirection('idle')
          // Remove from tracking array after execution
          timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId)
        }, 500)
        timeoutsRef.current.push(timeoutId)
      }
      
      return newPosition
    })
  }, [localGameState.gameEnded, lives, playerDirection, isInvulnerable])

  // Handle player death
  const handlePlayerDeath = useCallback(() => {
    // Prevent multiple deaths in rapid succession
    if (isInvulnerable) return
    
    // Make player invulnerable for a short time
    setIsInvulnerable(true)
    
    // Play splat sound for collision
    audioManager.play('splat')
    setPlayerDirection('death')
    
    const newLives = lives - 1
    setLives(newLives)
    
    if (newLives <= 0) {
      // Game over - use setTimeout directly to avoid circular dependency
      const timeoutId = setTimeout(() => {
        handleGameEnd('death')
        // Remove from tracking array after execution
        timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId)
      }, 1000)
      timeoutsRef.current.push(timeoutId)
    } else {
      // Reset position after death animation and remove invulnerability
      const timeoutId = setTimeout(() => {
        setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
        setPlayerDirection('idle')
        setIsInvulnerable(false) // Remove invulnerability after respawn
        // Remove from tracking array after execution
        timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId)
      }, 1000)
      timeoutsRef.current.push(timeoutId)
    }
  }, [lives, isInvulnerable, handleGameEnd])

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

  // Touch/Click controls for mobile devices
  const handleCanvasClick = useCallback((event) => {
    if (localGameState.gameEnded || lives <= 0) return
    if (playerDirection === 'death' || isInvulnerable) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = GAME_CONFIG.canvasWidth / rect.width
    const scaleY = GAME_CONFIG.canvasHeight / rect.height
    
    const clickX = (event.clientX - rect.left) * scaleX
    const clickY = (event.clientY - rect.top) * scaleY

    // Calculate relative position to frog
    const frogCenterX = playerPosition.x + GAME_CONFIG.frogSize / 2
    const frogCenterY = playerPosition.y + GAME_CONFIG.frogSize / 2

    const deltaX = clickX - frogCenterX
    const deltaY = clickY - frogCenterY

    // Determine direction based on largest absolute difference
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      if (deltaX > 0) {
        movePlayer('right')
      } else {
        movePlayer('left')
      }
    } else {
      // Vertical movement
      if (deltaY > 0) {
        movePlayer('down')
      } else {
        movePlayer('up')
      }
    }
  }, [localGameState.gameEnded, lives, playerDirection, isInvulnerable, playerPosition, movePlayer])

  // Touch controls for mobile - prevent scrolling and handle touch
  const handleTouchStart = useCallback((event) => {
    event.preventDefault() // Prevent scrolling
    if (event.touches.length === 1) {
      // Convert touch to click-like event
      const touch = event.touches[0]
      const mockEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
      }
      handleCanvasClick(mockEvent)
    }
  }, [handleCanvasClick])

  // Handle touch end for better responsiveness
  const handleTouchEnd = useCallback((event) => {
    event.preventDefault() // Prevent default touch behavior
  }, [])

  // Collision detection
  const checkCollisions = useCallback(() => {
    if (localGameState?.gameEnded) return
    
    // Defensive check for obstacles array
    const obstacles = localGameState?.obstacles
    if (!obstacles || !Array.isArray(obstacles)) {
      console.warn('🐸 Invalid obstacles array:', obstacles, typeof obstacles)
      return
    }

    let onLog = false
    let currentLogSpeed = 0

    obstacles.forEach(obstacle => {
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
          // Hit by vehicle - player dies
          handlePlayerDeath()
        } else if (obstacle.type === 'log') {
          // On a log - move with it
          onLog = true
          currentLogSpeed = obstacle.speed
        } else if (obstacle.type === 'turtle') {
          // Enhanced turtle diving detection
          const now = Date.now()
          const cycleTime = 4800 // Total cycle duration in ms
          const phaseTime = 800 // Duration of each phase in ms
          const adjustedTime = (now + obstacle.animationOffset) % cycleTime
          const currentPhase = Math.floor(adjustedTime / phaseTime)
          
          // Phases: 0=surface, 1=diving1, 2=diving2, 3=diving3(invisible), 4=diving2, 5=diving1
          const isSafe = currentPhase === 0 || currentPhase === 1 || currentPhase === 5 // Surface and shallow diving phases
          const isDeadly = currentPhase === 3 // Completely submerged (invisible)
          const isRisky = currentPhase === 2 || currentPhase === 4 // Deep diving phases
          
          if (isDeadly) {
            // Turtle is completely submerged - frog drowns immediately
            console.log('🐸💀 Frog drowned - turtle completely submerged (phase 3)')
            handlePlayerDeath()
          } else if (isSafe) {
            // Turtle is visible and safe to ride
            onLog = true
            currentLogSpeed = obstacle.speed
          } else if (isRisky) {
            // Turtle is in deep diving phase - still rideable but warning player
            onLog = true
            currentLogSpeed = obstacle.speed
            // Could add visual warning here in future (screen flash, etc.)
          }
        }
      }
    })

    // Check if in river without log/turtle
    const playerLane = GAME_CONFIG.lanes.find(lane => 
      Math.abs(lane.y - playerPosition.y) < GAME_CONFIG.frogSize
    )
    
    if (playerLane && (playerLane.type === 'log' || playerLane.type === 'turtle') && !onLog) {
      // In water without log - drown
      handlePlayerDeath()
    }

    setIsOnLog(onLog)
    setLogSpeed(currentLogSpeed)
  }, [localGameState, playerPosition, handlePlayerDeath])

  // Move player with log if on one - integrated into game loop for continuous movement

  // Game loop
  useEffect(() => {
    if (!gameStarted || localGameState?.gameEnded) return

    const gameLoop = () => {
      // Update obstacles with defensive checks
      setLocalGameState(prev => {
        if (!prev || !Array.isArray(prev.obstacles) || prev.gameEnded) {
          return prev || { obstacles: [], timeLeft: GAME_CONFIG.timeLimit, gameEnded: false, gameStartTime: null, leaderboard: [] }
        }
        
        return {
          ...prev,
          obstacles: prev.obstacles.map(obstacle => {
            let newX = obstacle.x + obstacle.speed
            // Wrap around screen
            if (obstacle.speed > 0 && newX > GAME_CONFIG.canvasWidth) {
              newX = -obstacle.width
            } else if (obstacle.speed < 0 && newX < -obstacle.width) {
              newX = GAME_CONFIG.canvasWidth
            }
            return {
              ...obstacle,
              x: newX
            }
          })
        }
      })

      checkCollisions()
      
      // Move player with log/turtle if on one (continuous movement)
      if (isOnLog && logSpeed !== 0) {
        setPlayerPosition(prev => ({
          ...prev,
          x: Math.max(0, Math.min(GAME_CONFIG.canvasWidth - GAME_CONFIG.frogSize, prev.x + logSpeed))
        }))
      }
      
      draw()
      
      // Only continue if game is still running
      if (!localGameState?.gameEnded) {
        animationRef.current = requestAnimationFrame(gameLoop)
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [gameStarted, localGameState?.gameEnded, checkCollisions, isOnLog, logSpeed])

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || localGameState?.gameEnded) return

    const ctx = canvas.getContext('2d')
    const { scale } = canvasSize
    
    // Apply scaling transform
    ctx.save()
    ctx.scale(scale, scale)
    
    // Performance optimization: only clear what's needed
    ctx.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight)

    // Draw background - use solid colors for terrain, sprites for grass safe zones
    // Sky area
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.goalY)
    
    // Goal area with grass sprites if available, otherwise green
    if (allSpritesLoaded && spritesLoaded.terrain) {
      for (let x = 0; x < GAME_CONFIG.canvasWidth; x += 32) {
        drawSprite(ctx, 'grass', x, GAME_CONFIG.goalY, 32, 40)
      }
    } else {
      ctx.fillStyle = '#90EE90' // Light green for goal area
      ctx.fillRect(0, GAME_CONFIG.goalY, GAME_CONFIG.canvasWidth, 40)
    }
    
    // River area - use water sprite tiles if available, otherwise solid blue background
    if (allSpritesLoaded && spriteImagesRef.current['water']) {
      // Draw water tiles across the river area
      const waterSpriteWidth = 60 // Width of water sprite
      const waterSpriteHeight = 32 // Height of water sprite
      const riverStartY = 160
      const riverHeight = 200
      
      for (let y = riverStartY; y < riverStartY + riverHeight; y += waterSpriteHeight) {
        for (let x = 0; x < GAME_CONFIG.canvasWidth; x += waterSpriteWidth) {
          drawSprite(ctx, 'water', x, y, waterSpriteWidth, waterSpriteHeight)
        }
      }
    } else {
      // Fallback to solid blue background
      ctx.fillStyle = '#4169E1' // Blue for river
      ctx.fillRect(0, 160, GAME_CONFIG.canvasWidth, 200)
    }

    // Safe zones with grass sprites if available
    if (allSpritesLoaded && spritesLoaded.terrain) {
      for (let x = 0; x < GAME_CONFIG.canvasWidth; x += 32) {
        drawSprite(ctx, 'grass', x, 360, 32, 40)
        drawSprite(ctx, 'grass', x, 560, 32, 40)
      }
    } else {
      ctx.fillStyle = '#90EE90' // Light green for safe zones
      ctx.fillRect(0, 360, GAME_CONFIG.canvasWidth, 40)
      ctx.fillRect(0, 560, GAME_CONFIG.canvasWidth, 40)
    }

    // Road area - solid gray background  
    ctx.fillStyle = '#696969' // Gray for road
    ctx.fillRect(0, 400, GAME_CONFIG.canvasWidth, 160)

    // Draw lane dividers - use dashed yellow lines
    ctx.strokeStyle = '#FFFF00'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    for (let i = 435; i < 535; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(GAME_CONFIG.canvasWidth, i)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // Draw obstacles using individual sprites
    const obstacles = localGameState?.obstacles
    if (obstacles && Array.isArray(obstacles) && obstacles.length > 0) {
      // Performance optimization: cache animation frame calculation
      const now = Date.now()
      
      obstacles.forEach(obstacle => {
        // Skip drawing obstacles that are completely off-screen (performance optimization)
        if (obstacle.x > GAME_CONFIG.canvasWidth + 50 || obstacle.x < -obstacle.width - 50) return
        
        if (allSpritesLoaded) {
          // Use the sprite key directly from the obstacle config
          if (obstacle.sprite) {
            // Use the sprite key directly with turtle animation support
            let spriteKey = obstacle.sprite
            // Enhanced turtle diving animation with 4 phases
            if (obstacle.type === 'turtle') {
              // Complete diving cycle: surface -> diving1 -> diving2 -> diving3 (invisible) -> diving2 -> diving1 -> surface
              // Each phase lasts 800ms, complete cycle takes 4.8 seconds
              const cycleTime = 4800 // Total cycle duration in ms
              const phaseTime = 800 // Duration of each phase in ms
              const adjustedTime = (now + obstacle.animationOffset) % cycleTime
              const currentPhase = Math.floor(adjustedTime / phaseTime)
              
              switch (currentPhase) {
                case 0: // Surface - visible turtle
                  spriteKey = 'turtle'
                  break
                case 1: // Starting to dive
                  spriteKey = 'turtle-diving1'
                  break
                case 2: // Deeper diving
                  spriteKey = 'turtle-diving2'
                  break
                case 3: // Completely submerged (invisible)
                  spriteKey = 'turtle-diving3'
                  break
                case 4: // Emerging
                  spriteKey = 'turtle-diving2'
                  break
                case 5: // Almost surfaced
                  spriteKey = 'turtle-diving1'
                  break
                default: // Back to surface
                  spriteKey = 'turtle'
              }
              
              // For turtle-diving3, make the turtle invisible or very faint
              if (currentPhase === 3) {
                // Don't draw the turtle at all when fully submerged, or draw it very faintly
                ctx.save()
                ctx.globalAlpha = 0.1 // Very faint visibility to show position but indicate it's submerged
                drawSprite(ctx, spriteKey, obstacle.x, obstacle.y, obstacle.width, obstacle.height)
                ctx.restore()
              } else {
                // Draw normally for all other phases
                drawSprite(ctx, spriteKey, obstacle.x, obstacle.y, obstacle.width, obstacle.height)
              }
            } else {
              // Non-turtle obstacles draw normally
              drawSprite(ctx, spriteKey, obstacle.x, obstacle.y, obstacle.width, obstacle.height)
            }
        } else {
          // Fallback to colored rectangle if no sprite defined
          ctx.fillStyle = obstacle.color
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
        }
      } else {
        // Fallback to simple colored rectangles if sprites not loaded
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
      }
      })
    }

    // Draw the local player
    const frogSpriteKey = playerDirection === 'idle' || !playerDirection ? 'idle' : playerDirection
    
    // Use drawSprite function to properly handle sprite mapping (including death -> squish)
    drawSprite(ctx, frogSpriteKey, playerPosition.x, playerPosition.y, GAME_CONFIG.frogSize, GAME_CONFIG.frogSize)

    // Draw goal area
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(0, GAME_CONFIG.goalY - 40, GAME_CONFIG.canvasWidth, 40)
    ctx.fillStyle = '#000000'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🏁 GOAL 🏁', GAME_CONFIG.canvasWidth / 2, GAME_CONFIG.goalY - 15)

    // Restore the context (remove scaling)
    ctx.restore()

  }, [localGameState, playerPosition, playerDirection, allSpritesLoaded, spritesLoaded, drawSprite, canvasSize])

  // Render loop integrated into game loop above to prevent duplicate animation frames

  // Reset game to initial state
  const handleResetGame = () => {
    setGameStarted(false)
    // Clear any pending timeouts directly
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setLocalGameState({
      obstacles: [],
      timeLeft: GAME_CONFIG.timeLimit,
      gameEnded: false,
      gameStartTime: null,
      leaderboard: []
    })
    
    // Reset player state
    setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
    setPlayerDirection('idle')
    setLives(GAME_CONFIG.maxLives)
    setScore(0)
    setIsOnLog(false)
    setLogSpeed(0)
    setIsInvulnerable(false)
    
    // Cancel any running animations
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  // Start game handler
  const handleStartGame = () => {
    setGameStarted(true)
    const obstacles = initializeObstacles()
    setLocalGameState(prev => ({
      ...prev,
      obstacles,
      gameStartTime: Date.now(),
      timeLeft: GAME_CONFIG.timeLimit,
      gameEnded: false  // Ensure game is not ended when starting
    }))
    
    // Reset player state
    setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
    setPlayerDirection('idle')
    setLives(GAME_CONFIG.maxLives)
    setScore(0)
    setIsInvulnerable(false)
    
    // Request current leaderboard
    if (socket) {
      socket.emit('frogger-request-leaderboard', { sessionId })
    }
  }

  // Handle closing the frogger game modal
  const handleCloseGame = useCallback(() => {
    // Emit socket event to notify server that user is closing the modal
    if (socket && sessionId && currentUser) {
      socket.emit('close-frogger-modal', {
        sessionId,
        user: currentUser
      })
    }
    
    // Call the parent close handler
    onClose()
  }, [socket, sessionId, currentUser, onClose])

  // Handle difficulty selection and start game
  const handleDifficultySelection = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty)
    // Use setTimeout to ensure state is updated before starting game
    setTimeout(() => {
      handleStartGame()
    }, 0)
  }

  // Play Again handler - resets game and starts immediately without going to lobby
  const handlePlayAgain = () => {
    // Clear any pending timeouts directly
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    
    // Cancel any running animations
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    // Initialize new game state with fresh obstacles
    const obstacles = initializeObstacles()
    setLocalGameState({
      obstacles,
      timeLeft: GAME_CONFIG.timeLimit,
      gameEnded: false,
      gameStartTime: Date.now(),
      leaderboard: []
    })
    
    // Reset player state
    setPlayerPosition({ x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.startY })
    setPlayerDirection('idle')
    setLives(GAME_CONFIG.maxLives)
    setScore(0)
    setIsOnLog(false)
    setLogSpeed(0)
    setIsInvulnerable(false)
    
    // Keep gameStarted as true to bypass lobby
    // Request current leaderboard
    if (socket) {
      socket.emit('frogger-request-leaderboard', { sessionId })
    }
  }

  if (localGameState.gameEnded) {
    return (
      <div className="drawing-game-overlay" onClick={e => e.target === e.currentTarget && handleCloseGame()}>
        <div className="drawing-game-modal">
          <div className="drawing-game-header">
            <h3>🐸 Frogger - Game Over!</h3>
            <button 
              className="close-button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseGame();
              }}
            >
              ×
            </button>
          </div>
          
          <div className="game-results">
            <h4>🏆 Final Scores:</h4>
            <div className="leaderboard">
              {(localGameState.leaderboard || []).map((player, index) => (
                <div key={player.player || player.username || index} className={`leaderboard-entry ${index === 0 ? 'winner' : ''}`}>
                  <span className="rank">#{index + 1}</span>
                  <span className="player-name">{player.player || player.username || 'Unknown'}</span>
                  <span className="player-score">{player.score || 0} points</span>
                </div>
              ))}
              {(!localGameState.leaderboard || localGameState.leaderboard.length === 0) && (
                <div className="no-scores">No scores available yet</div>
              )}
            </div>
            
            {localGameState.winners && localGameState.winners.length > 0 && (
              <div className="winners">
                <h4>🎉 Winners: {localGameState.winners.join(', ')}</h4>
              </div>
            )}
          </div>
          
          <div className="game-over-actions">
            <button className="start-game-btn" onClick={handlePlayAgain}>
              🐸 Play Again
            </button>
            <button 
              className="close-button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseGame();
              }}
            >
              Close Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="drawing-game-overlay" onClick={e => e.target === e.currentTarget && handleCloseGame()}>
      <div className="frogger-game-modal">
        <div className="drawing-game-header">
          <h3>🐸 Frogger - Leaderboard Challenge</h3>
          <button 
            className="close-button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCloseGame();
            }}
          >
            ×
          </button>
        </div>
        
        {!gameStarted ? (
          <div className="game-lobby">
            <div className="game-instructions">
              <h4>How to Play:</h4>
              <ul>
                <li>Cross roads safely - avoid cars and trucks! Jump on logs and turtles to cross the river</li>
                <li><strong>⚠️ Turtles dive underwater!</strong> When they're completely submerged you'll drown! Don't fall in the water!</li>
                <li>Reach the goal to score points with your {GAME_CONFIG.maxLives} lives</li>
              </ul>
              
              <div className="difficulty-selector" style={{ marginBottom: '20px' }}>
                <h4>Click Any Difficulty to Start Game:</h4>
                <div className="difficulty-options" style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <label 
                    className={`difficulty-option ${difficulty === 'easy' ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      handleDifficultySelection('easy')
                    }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '10px 15px', 
                      border: `2px solid ${difficulty === 'easy' ? '#4CAF50' : '#ddd'}`, 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      backgroundColor: difficulty === 'easy' ? '#e8f5e8' : '#f9f9f9',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="difficulty" 
                      value="easy" 
                      checked={difficulty === 'easy'}
                      onChange={(e) => handleDifficultySelection(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <span className="difficulty-label" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '5px' }}>🐢</div>
                      <div style={{ fontWeight: 'bold' }}>Easy</div>
                      <small style={{ color: '#666', fontSize: '12px' }}>Half speed obstacles</small>
                    </span>
                  </label>
                  <label 
                    className={`difficulty-option ${difficulty === 'normal' ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      handleDifficultySelection('normal')
                    }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '10px 15px', 
                      border: `2px solid ${difficulty === 'normal' ? '#2196F3' : '#ddd'}`, 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      backgroundColor: difficulty === 'normal' ? '#e3f2fd' : '#f9f9f9',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="difficulty" 
                      value="normal" 
                      checked={difficulty === 'normal'}
                      onChange={(e) => handleDifficultySelection(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <span className="difficulty-label" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '5px' }}>🐸</div>
                      <div style={{ fontWeight: 'bold' }}>Normal</div>
                      <small style={{ color: '#666', fontSize: '12px' }}>Standard speed</small>
                    </span>
                  </label>
                  <label 
                    className={`difficulty-option ${difficulty === 'hard' ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      handleDifficultySelection('hard')
                    }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '10px 15px', 
                      border: `2px solid ${difficulty === 'hard' ? '#FF5722' : '#ddd'}`, 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      backgroundColor: difficulty === 'hard' ? '#fbe9e7' : '#f9f9f9',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="difficulty" 
                      value="hard" 
                      checked={difficulty === 'hard'}
                      onChange={(e) => handleDifficultySelection(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <span className="difficulty-label" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '5px' }}>🏎️</div>
                      <div style={{ fontWeight: 'bold' }}>Hard</div>
                      <small style={{ color: '#666', fontSize: '12px' }}>30% faster obstacles</small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="player-list">
                <h4>Session Players ({sessionUsers.length}):</h4>
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
          </div>
        ) : (
          <div className="game-area">
            <div className="frogger-canvas-container">
              <div className="game-stats game-stats-overlay">
                <div className="stat">Score: {score}</div>
                <div className="stat">Lives: {'❤️'.repeat(Math.max(0, lives || 0))}</div>
                <div className="stat">Time: {Math.max(0, localGameState?.timeLeft || 0)}s</div>
                <div className="stat">Leaderboard: {(localGameState?.leaderboard?.length || 0)} scores</div>
              </div>
              
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="frogger-canvas"
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{ 
                  touchAction: 'none',
                  maxWidth: '100%'
                }}
              />
            </div>
            
            {/* Touch Control Buttons for Mobile */}
            <div className="frogger-touch-controls">
              <button 
                className="control-btn control-btn-left"
                onTouchStart={(e) => { e.preventDefault(); movePlayer('left') }}
                onClick={() => movePlayer('left')}
                disabled={localGameState.gameEnded || lives <= 0 || playerDirection === 'death' || isInvulnerable}
              >
                ⬅
              </button>
              <button 
                className="control-btn control-btn-up"
                onTouchStart={(e) => { e.preventDefault(); movePlayer('up') }}
                onClick={() => movePlayer('up')}
                disabled={localGameState.gameEnded || lives <= 0 || playerDirection === 'death' || isInvulnerable}
              >
                ⬆
              </button>
              <button 
                className="control-btn control-btn-down"
                onTouchStart={(e) => { e.preventDefault(); movePlayer('down') }}
                onClick={() => movePlayer('down')}
                disabled={localGameState.gameEnded || lives <= 0 || playerDirection === 'death' || isInvulnerable}
              >
                ⬇
              </button>
              <button 
                className="control-btn control-btn-right"
                onTouchStart={(e) => { e.preventDefault(); movePlayer('right') }}
                onClick={() => movePlayer('right')}
                disabled={localGameState.gameEnded || lives <= 0 || playerDirection === 'death' || isInvulnerable}
              >
                ➡
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FroggerGame