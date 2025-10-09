import React from 'react'

function Footer({ connectionType, sessionId }) {
  return (
    <footer className="footer">
      <span id="connection-type-display" className="connection-type">
        Connection: {connectionType}
      </span>
      {sessionId && (
        <span id="session-id-display" className="session-id">
          Session: {sessionId}
        </span>
      )}
    </footer>
  )
}

export default Footer