import React from 'react'

function Footer({ connectionType }) {
  return (
    <footer className="footer">
      <span id="connection-type-display" className="connection-type">
        Connection: {connectionType}
      </span>
    </footer>
  )
}

export default Footer