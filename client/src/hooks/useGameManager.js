import { useState, useEffect, useCallback, useRef } from 'react'
import { gameManager } from '../utils/gameManager'
import { generateFunnyUsername } from '../utils/identityUtils'

/**
 * Custom hook for managing game state and integration with React
 */
export function useGameManager(socketRef, sessionId, userIdentity, showToast) {
  // Local state that mirrors the game manager state
  const [gameState, setGameState] = useState(gameManager.getGameState())
  const isInitialized = useRef(false)

  // Sync local state with game manager
  const syncState = useCallback(() => {
    setGameState(gameManager.getGameState())
  }, [])

  // Initialize game manager and set up event listeners
  useEffect(() => {
    if (isInitialized.current) return
    
    // Set up game manager event listeners
    const handleStateChange = () => syncState()
    const handleToast = (data) => showToast(data.message, data.type)
    
    gameManager.addEventListener('gameActiveChanged', handleStateChange)
    gameManager.addEventListener('gameModalChanged', handleStateChange)
    gameManager.addEventListener('gameTypeChanged', handleStateChange)
    gameManager.addEventListener('wordSelectionChanged', handleStateChange)
    gameManager.addEventListener('wordChoicesChanged', handleStateChange)
    gameManager.addEventListener('drawingGameStateChanged', handleStateChange)
    gameManager.addEventListener('showToast', handleToast)
    gameManager.addEventListener('gameReset', handleStateChange)

    // Register socket listeners
    if (socketRef?.current) {
      gameManager.registerSocketListeners(socketRef)
    }

    isInitialized.current = true

    // Cleanup function
    return () => {
      gameManager.removeEventListener('gameActiveChanged', handleStateChange)
      gameManager.removeEventListener('gameModalChanged', handleStateChange)
      gameManager.removeEventListener('gameTypeChanged', handleStateChange)
      gameManager.removeEventListener('wordSelectionChanged', handleStateChange)
      gameManager.removeEventListener('wordChoicesChanged', handleStateChange)
      gameManager.removeEventListener('drawingGameStateChanged', handleStateChange)
      gameManager.removeEventListener('showToast', handleToast)
      gameManager.removeEventListener('gameReset', handleStateChange)
      
      if (socketRef?.current) {
        gameManager.unregisterSocketListeners(socketRef)
      }
      
      isInitialized.current = false
    }
  }, [socketRef, syncState, showToast])

  // Re-register socket listeners when socket becomes available or connects
  useEffect(() => {
    if (isInitialized.current && socketRef?.current) {
      console.log('🎮 Registering game manager socket listeners')
      gameManager.unregisterSocketListeners(socketRef)
      gameManager.registerSocketListeners(socketRef)
    }
  }, [socketRef?.current, socketRef?.current?.connected])

  // Game action handlers
  const startGame = useCallback((gameType = 'drawing') => {
    const username = userIdentity.username || generateFunnyUsername()
    return gameManager.startGame(gameType, socketRef, sessionId, { username })
  }, [socketRef, sessionId, userIdentity])

  const selectWord = useCallback((selectedWord) => {
    const username = userIdentity.username || generateFunnyUsername()
    return gameManager.selectWord(selectedWord, socketRef, sessionId, { username })
  }, [socketRef, sessionId, userIdentity])

  const cancelWordSelection = useCallback(() => {
    gameManager.cancelWordSelection()
  }, [])

  const closeGameModal = useCallback(() => {
    const username = userIdentity.username || generateFunnyUsername()
    gameManager.closeGameModal(socketRef, sessionId, { username })
  }, [socketRef, sessionId, userIdentity])

  const resetGame = useCallback(() => {
    gameManager.reset()
  }, [])

  // Return game state and actions
  return {
    // State
    gameActive: gameState.gameActive,
    showGameModal: gameState.showGameModal,
    currentGameType: gameState.currentGameType,
    showWordSelection: gameState.showWordSelection,
    wordChoices: gameState.wordChoices,
    drawingGameState: gameState.drawingGameState,
    
    // Actions
    startGame,
    selectWord,
    cancelWordSelection,
    closeGameModal,
    resetGame,
    
    // Direct access to game manager for advanced use cases
    gameManager
  }
}