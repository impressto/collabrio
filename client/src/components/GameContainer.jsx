import React from 'react'
import DrawingGame from './DrawingGame'
import FroggerGame from './FroggerGame'
import WordSelection from './WordSelection'

function GameContainer({
  // Game state
  showGameModal,
  currentGameType,
  showWordSelection,
  wordChoices,
  drawingGameState,
  
  // Socket and session
  socket,
  sessionId,
  currentUser,
  sessionUsers,
  
  // Game actions
  onCloseGame,
  onSelectWord,
  onCancelWordSelection
}) {
  return (
    <>
      {/* Game Modal - Drawing or Frogger */}
      {showGameModal && currentGameType === 'drawing' && (
        <DrawingGame
          gameState={drawingGameState}
          socket={socket}
          sessionId={sessionId}
          currentUser={currentUser}
          sessionUsers={sessionUsers}
          onClose={onCloseGame}
        />
      )}

      {showGameModal && currentGameType === 'frogger' && (
        <FroggerGame
          gameState={drawingGameState} // Frogger manages its own state internally
          socket={socket}
          sessionId={sessionId}
          currentUser={currentUser}
          sessionUsers={sessionUsers}
          onClose={onCloseGame}
        />
      )}

      {/* Word Selection Modal */}
      {showWordSelection && (
        <WordSelection
          wordChoices={wordChoices}
          currentUser={currentUser}
          onSelectWord={onSelectWord}
          onCancel={onCancelWordSelection}
        />
      )}
    </>
  )
}

export default GameContainer