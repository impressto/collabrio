import React from 'react'
import DrawingGame from './DrawingGame'
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
      {/* Drawing Game Modal */}
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