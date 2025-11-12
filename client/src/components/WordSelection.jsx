import React from 'react'

function WordSelection({ wordChoices, onSelectWord, onCancel, currentUser }) {
  return (
    <div className="word-selection-overlay">
      <div className="word-selection-modal">
        <div className="word-selection-header">
          <h3>Choose a Word to Draw</h3>
          <button className="close-selection-btn" onClick={onCancel}>✕</button>
        </div>
        
        <div className="word-selection-content">
          <p className="selection-instruction">
            Hey {currentUser}! Pick a word from the list below to start drawing:
          </p>
          
          <div className="word-choices-grid">
            {wordChoices.map((word, index) => (
              <button
                key={index}
                className="word-choice-btn"
                onClick={() => onSelectWord(word)}
              >
                {word}
              </button>
            ))}
          </div>
          
          <div className="selection-footer">
            <button className="cancel-selection-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WordSelection