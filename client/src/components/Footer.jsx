import React from 'react'

function Footer({ connectionType, sessionId }) {
  return (
    <footer className="footer">
      <div className="footer-status">
        <span id="connection-type-display" className="connection-type">
          Connection: {connectionType}
        </span>
        {sessionId && (
          <>
            <span id="session-id-display" className="session-id">
              Session: {sessionId}
            </span>
          </>
        )}
      </div>
      <div className="footer-info">
        <p>
          📚 Educational App: Demonstrates spec & memory documentation using{' '}
          <a href="https://github.com/impressto/arcana" target="_blank" rel="noopener noreferrer">
            Arcana Docs Generator
          </a>
          {' • '}
          <a href="https://github.com/impressto/collabrio" target="_blank" rel="noopener noreferrer">
            View Source
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer