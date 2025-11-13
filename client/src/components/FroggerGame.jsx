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
  'turtle-surface': { width: 64, height: 32 },
  'turtle-diving': { width: 64, height: 32 },
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
  const audioRef = useRef({})
  const timeoutsRef = useRef([]) // Track all timeouts for cleanup
  
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

  // Initialize game state on component mount
  useEffect(() => {
    // Reset to initial state when component mounts
    setGameStarted(false)
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
    
    // Preload game audio files
    audioManager.preloadSound('hop', 'audio/hop.mp3')
    audioManager.preloadSound('splat', 'audio/splat.mp3') 
    audioManager.preloadSound('horray', 'audio/horray.mp3')
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

  // Load audio files
  useEffect(() => {
    const loadAudio = () => {
      const audioFiles = {
        hop: '/audio/hop.mp3',
        splat: '/audio/splat.mp3',
        hooray: '/audio/hooray.mp3'
      }

      Object.entries(audioFiles).forEach(([key, path]) => {
        const audio = new Audio(path)
        audio.preload = 'auto'
        audio.volume = 0.5 // Set moderate volume
        
        // Handle loading success
        audio.addEventListener('canplaythrough', () => {
          console.log(`🔊 Audio loaded: ${key}`)
        })
        
        // Handle loading errors
        audio.addEventListener('error', (e) => {
          console.warn(`🔇 Failed to load audio: ${key} from ${path}`, e)
        })
        
        audioRef.current[key] = audio
      })
    }

    loadAudio()
  }, [])

  // Play audio helper function
  const _playAudio = useCallback((soundKey) => {
    const audio = audioRef.current[soundKey]
    if (audio) {
      try {
        audio.currentTime = 0 // Reset to start
        audio.play().catch(e => {
          console.warn(`🔇 Failed to play audio: ${soundKey}`, e)
        })
      } catch (error) {
        console.warn(`🔇 Error playing audio: ${soundKey}`, error)
      }
    }
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
          sprite: lane.sprite, // Add sprite key from config
          color: lane.color,
          laneIndex
        })
      }
    })
    
    return obstacles
  }, [])

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
        audioManager.play('horray')
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
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
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
          // Check if turtle is diving or surfaced
          const turtleFrame = Math.floor(Date.now() / 2000) % 2
          const isDiving = turtleFrame === 1
          
          if (isDiving) {
            // Diving turtle - frog drowns
            handlePlayerDeath()
          } else {
            // Surface turtle - safe to ride
            onLog = true
            currentLogSpeed = obstacle.speed
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
    // Performance optimization: only clear what's needed
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background - use solid colors for terrain, sprites for grass safe zones
    // Sky area
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(0, 0, canvas.width, GAME_CONFIG.goalY)
    
    // Goal area with grass sprites if available, otherwise green
    if (allSpritesLoaded && spritesLoaded.terrain) {
      for (let x = 0; x < canvas.width; x += 32) {
        drawSprite(ctx, 'grass', x, GAME_CONFIG.goalY, 32, 40)
      }
    } else {
      ctx.fillStyle = '#90EE90' // Light green for goal area
      ctx.fillRect(0, GAME_CONFIG.goalY, canvas.width, 40)
    }
    
    // River area - solid blue background
    ctx.fillStyle = '#4169E1' // Blue for river
    ctx.fillRect(0, 160, canvas.width, 200)

    // Safe zones with grass sprites if available
    if (allSpritesLoaded && spritesLoaded.terrain) {
      for (let x = 0; x < canvas.width; x += 32) {
        drawSprite(ctx, 'grass', x, 360, 32, 40)
        drawSprite(ctx, 'grass', x, 560, 32, 40)
      }
    } else {
      ctx.fillStyle = '#90EE90' // Light green for safe zones
      ctx.fillRect(0, 360, canvas.width, 40)
      ctx.fillRect(0, 560, canvas.width, 40)
    }

    // Road area - solid gray background  
    ctx.fillStyle = '#696969' // Gray for road
    ctx.fillRect(0, 400, canvas.width, 160)

    // Draw lane dividers - use dashed yellow lines
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

    // Draw obstacles using individual sprites
    const obstacles = localGameState?.obstacles
    if (obstacles && Array.isArray(obstacles) && obstacles.length > 0) {
      // Performance optimization: cache animation frame calculation
      const now = Date.now()
      
      obstacles.forEach(obstacle => {
        // Skip drawing obstacles that are completely off-screen (performance optimization)
        if (obstacle.x > canvas.width + 50 || obstacle.x < -obstacle.width - 50) return
        
        if (allSpritesLoaded) {
          // Use the sprite key directly from the obstacle config
          if (obstacle.sprite) {
            // Use the sprite key directly with turtle animation support
            let spriteKey = obstacle.sprite
            // Animate turtles between surface and diving states
            if (obstacle.type === 'turtle') {
              const turtleFrame = Math.floor(now / 2000) % 2 // Change every 2 seconds
              spriteKey = turtleFrame === 0 ? 'turtle' : 'turtle-diving'
            }
            drawSprite(ctx, spriteKey, obstacle.x, obstacle.y, obstacle.width, obstacle.height)
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
    ctx.fillRect(0, GAME_CONFIG.goalY - 40, canvas.width, 40)
    ctx.fillStyle = '#000000'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🏁 GOAL 🏁', canvas.width / 2, GAME_CONFIG.goalY - 15)

  }, [localGameState, playerPosition, playerDirection, allSpritesLoaded, spritesLoaded, drawSprite])

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

  if (localGameState.gameEnded) {
    return (
      <div className="drawing-game-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="drawing-game-modal">
          <div className="drawing-game-header">
            <h3>🐸 Frogger - Game Over!</h3>
            <button 
              className="close-button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
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
            <button className="start-game-btn" onClick={handleResetGame}>
              🐸 Play Again
            </button>
            <button 
              className="close-button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
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
    <div className="drawing-game-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="frogger-game-modal">
        <div className="drawing-game-header">
          <h3>🐸 Frogger - Leaderboard Challenge</h3>
          <button 
            className="close-button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
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
                <li>Move: Arrow keys, WASD, tap screen, or use touch buttons</li>
                <li>Cross roads safely - avoid cars and trucks!</li>
                <li>Jump on logs and turtles to cross the river</li>
                <li>Don't fall in the water!</li>
                <li>Reach the goal to score points</li>
                <li>You have {GAME_CONFIG.maxLives} lives</li>
              </ul>
              
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
            
            <button className="start-game-btn" onClick={handleStartGame}>
              🐸 Start Frogger Game
            </button>
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
                width={GAME_CONFIG.canvasWidth}
                height={GAME_CONFIG.canvasHeight}
                className="frogger-canvas"
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                style={{ touchAction: 'none' }}
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