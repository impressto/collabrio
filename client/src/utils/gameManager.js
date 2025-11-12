/**
 * Client-side Game Manager
 * Handles all game-related state management and logic
 */

export class ClientGameManager {
  constructor() {
    this.gameState = {
      // Common game state
      gameActive: false,
      showGameModal: false,
      currentGameType: null, // 'drawing' or 'frogger'
      
      // Drawing game specific
      showWordSelection: false,
      wordChoices: [],
      drawingGameState: {
        drawer: null,
        word: '',
        timeLeft: 60,
        guesses: [],
        isCorrectGuess: false,
        winner: null,
        winners: [],
        correctWord: ''
      }
    }
    
    this.listeners = {}
  }

  // Event listener pattern for state changes
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }

  // State getters
  getGameState() {
    return { ...this.gameState }
  }

  isGameActive() {
    return this.gameState.gameActive
  }

  getCurrentGameType() {
    return this.gameState.currentGameType
  }

  shouldShowGameModal() {
    return this.gameState.showGameModal
  }

  shouldShowWordSelection() {
    return this.gameState.showWordSelection
  }

  getWordChoices() {
    return [...this.gameState.wordChoices]
  }

  getDrawingGameState() {
    return { ...this.gameState.drawingGameState }
  }

  // State setters
  setGameActive(active) {
    if (this.gameState.gameActive !== active) {
      this.gameState.gameActive = active
      this.emit('gameActiveChanged', active)
    }
  }

  setShowGameModal(show) {
    if (this.gameState.showGameModal !== show) {
      this.gameState.showGameModal = show
      this.emit('gameModalChanged', show)
    }
  }

  setCurrentGameType(type) {
    if (this.gameState.currentGameType !== type) {
      this.gameState.currentGameType = type
      this.emit('gameTypeChanged', type)
    }
  }

  setShowWordSelection(show) {
    if (this.gameState.showWordSelection !== show) {
      this.gameState.showWordSelection = show
      this.emit('wordSelectionChanged', show)
    }
  }

  setWordChoices(choices) {
    this.gameState.wordChoices = [...choices]
    this.emit('wordChoicesChanged', choices)
  }

  updateDrawingGameState(updates) {
    const newState = { ...this.gameState.drawingGameState, ...updates }
    console.log('🎮 [GAME MANAGER] Updating drawing game state:', updates)
    this.gameState.drawingGameState = newState
    this.emit('drawingGameStateChanged', newState)
  }

  // Game actions
  startGame(gameType = 'drawing', socket, sessionId, userIdentity) {
    if (!socket?.current || !socket.current.connected || !sessionId) {
      console.warn('Cannot start game: missing socket connection or session ID')
      return false
    }

    this.setCurrentGameType(gameType)
    
    if (gameType === 'drawing') {
      // Request word choices from server for drawing game
      socket.current.emit('start-game', {
        sessionId,
        starter: userIdentity.username,
        gameType: 'drawing'
      })
    } else if (gameType === 'frogger') {
      // Start Frogger game directly
      this.setShowGameModal(true)
      this.setGameActive(true)
      // Emit frogger game start to other players
      socket.current.emit('start-frogger-game', {
        sessionId,
        starter: userIdentity.username,
        gameType: 'frogger'
      })
    }
    
    return true
  }

  selectWord(selectedWord, socket, sessionId, userIdentity) {
    console.log('🎮 [GAME MANAGER] Selecting word:', selectedWord, 'for user:', userIdentity.username)
    if (socket?.current && socket.current.connected && sessionId) {
      // Optimistically set the user as drawer when they select a word
      this.setGameActive(true)
      this.setShowGameModal(true)
      this.setCurrentGameType('drawing')
      this.updateDrawingGameState({
        drawer: userIdentity.username,
        word: selectedWord,
        timeLeft: 60,
        guesses: [],
        isCorrectGuess: false,
        winner: null
      })
      
      socket.current.emit('select-word', {
        sessionId,
        starter: userIdentity.username,
        selectedWord
      })
      this.setShowWordSelection(false)
      return true
    }
    return false
  }

  cancelWordSelection() {
    this.setShowWordSelection(false)
    this.setWordChoices([])
  }

  closeGameModal(socket, sessionId, userIdentity) {
    const gameType = this.getCurrentGameType()
    
    this.setShowGameModal(false)
    this.setCurrentGameType(null)
    
    // Notify server that this user closed their game modal
    if (socket?.current && sessionId) {
      if (gameType === 'drawing') {
        socket.current.emit('close-game-modal', {
          sessionId: sessionId,
          user: userIdentity.username,
          gameType: 'drawing'
        })
        
        // Reset drawing game state when closing modal (only affects this user)
        this.updateDrawingGameState({
          drawer: null,
          word: '',
          timeLeft: 60,
          guesses: [],
          isCorrectGuess: false,
          winner: null,
          winners: [],
          correctWord: ''
        })
      } else if (gameType === 'frogger') {
        socket.current.emit('close-frogger-modal', {
          sessionId: sessionId,
          user: userIdentity.username,
          gameType: 'frogger'
        })
      }
    }
  }

  // Socket event handlers
  handleWordSelection(data) {
    console.log('Received word choices:', data.wordChoices)
    this.setWordChoices(data.wordChoices)
    this.setShowWordSelection(true)
  }

  handleGameStarted(data) {
    console.log('🎮 [GAME MANAGER] Received game-started event:', data)
    this.setGameActive(true)
    this.setShowGameModal(true)
    this.setCurrentGameType(data.gameType || 'drawing')
    this.setShowWordSelection(false) // Hide word selection modal
    
    if (data.gameType === 'drawing') {
      console.log('🎮 [GAME MANAGER] Setting drawer to:', data.drawer)
      this.updateDrawingGameState({
        drawer: data.drawer,
        word: data.word,
        timeLeft: data.timeLeft || 60,
        guesses: [],
        isCorrectGuess: false,
        winner: null
      })
    }
    // No toast notification for game start - modal provides all information
  }

  handleGameEnded(data) {
    this.updateDrawingGameState({
      winner: data.winner, // Keep for backward compatibility
      winners: data.winners || [],
      correctWord: data.correctWord || this.gameState.drawingGameState.word,
      isCorrectGuess: !!(data.winners && data.winners.length > 0),
      canAssignNext: data.canAssignNext || false,
      originalDrawer: data.originalDrawer
    })
    
    // No toast notifications for game end - all information shown in modal
    // Keep the modal open so users can see who won
    // Modal visibility is controlled separately from gameActive
    // Users must manually close it by clicking the X button
  }

  handleGameGuess(data) {
    const currentGuesses = this.gameState.drawingGameState.guesses
    this.updateDrawingGameState({
      guesses: [...currentGuesses, data]
    })
  }

  handleGameTimerUpdate(data) {
    console.log('🕒 [GAME MANAGER] Timer update:', data.timeLeft)
    this.updateDrawingGameState({
      timeLeft: data.timeLeft
    })
  }

  handleCurrentGameState(data) {
    // Handle receiving current game state when joining a session with active game
    console.log('🎮 [GAME MANAGER] Received current game state:', data)
    this.setGameActive(true)
    this.setCurrentGameType('drawing') // Ensure game type is set
    this.setShowGameModal(true)
    this.updateDrawingGameState({
      drawer: data.drawer,
      word: data.word,
      timeLeft: data.timeLeft,
      guesses: data.guesses || [],
      isCorrectGuess: false,
      winner: null
    })
    // No toast notification for joining game - modal shows all necessary information
  }

  handleGameStatusChange(data) {
    // Handle game status changes to enable/disable game button for all users
    console.log('Game status change:', data)
    this.setGameActive(data.gameActive)
  }

  handleFroggerGameStarted(data) {
    this.setCurrentGameType('frogger')
    this.setGameActive(true)
    this.setShowGameModal(true)
    this.emit('showToast', { message: `🐸 Frogger game started by ${data.starter}!`, type: 'success' })
  }

  handleFroggerGameEnded(data) {
    this.setGameActive(false)
    this.emit('showToast', { message: `🐸 Frogger game ended!`, type: 'info' })
  }

  // Register all socket event listeners
  registerSocketListeners(socket) {
    if (!socket?.current) return
    
    console.log('🎮 [GAME MANAGER] Registering socket listeners')

    // Drawing game events
    socket.current.on('word-selection', this.handleWordSelection.bind(this))
    socket.current.on('game-started', this.handleGameStarted.bind(this))
    socket.current.on('game-ended', this.handleGameEnded.bind(this))
    socket.current.on('game-guess', this.handleGameGuess.bind(this))
    socket.current.on('game-timer-update', this.handleGameTimerUpdate.bind(this))
    socket.current.on('current-game-state', this.handleCurrentGameState.bind(this))
    socket.current.on('game-status-change', this.handleGameStatusChange.bind(this))

    // Frogger game events
    socket.current.on('frogger-game-started', this.handleFroggerGameStarted.bind(this))
    socket.current.on('frogger-game-ended', this.handleFroggerGameEnded.bind(this))

    // Pass through events that need special handling (toasts, etc.)
    socket.current.on('game-master-assigned', (data) => {
      this.emit('showToast', { 
        message: `🎮 ${data.newGameMaster} is now the game master! (assigned by ${data.assignedBy})`, 
        type: 'info' 
      })
    })

    socket.current.on('assignment-skipped', (data) => {
      this.emit('showToast', { message: `Game ended by ${data.skippedBy}`, type: 'info' })
    })

    socket.current.on('assignment-expired', () => {
      this.emit('showToast', { message: 'Assignment time expired - game ended', type: 'info' })
    })
  }

  // Unregister socket event listeners
  unregisterSocketListeners(socket) {
    if (!socket?.current) return

    const events = [
      'word-selection', 'game-started', 'game-ended', 'game-guess', 
      'game-timer-update', 'current-game-state', 'game-status-change',
      'frogger-game-started', 'frogger-game-ended',
      'game-master-assigned', 'assignment-skipped', 'assignment-expired'
    ]

    events.forEach(event => {
      socket.current.off(event)
    })
  }

  // Reset all state
  reset() {
    this.gameState = {
      gameActive: false,
      showGameModal: false,
      currentGameType: null,
      showWordSelection: false,
      wordChoices: [],
      drawingGameState: {
        drawer: null,
        word: '',
        timeLeft: 60,
        guesses: [],
        isCorrectGuess: false,
        winner: null,
        winners: [],
        correctWord: ''
      }
    }
    
    this.emit('gameReset')
  }
}

// Create singleton instance
export const gameManager = new ClientGameManager()