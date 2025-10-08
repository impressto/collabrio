import React from 'react'
import { config } from '../config.js'

function Header({ isConnected, connectionType, connectedUsers }) {
  return (
    <header className="collabrio-header">
      <h1>
        <img 
          src={config.logoUrl} 
          alt="Collabrio" 
          style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} 
        />
        Collabrio
      </h1>
      <div className="connection-info">
        <span id="connection-status" className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <span id="connection-type-display" className="connection-type">({connectionType})</span>
        <span id="user-count-display" className="users">👥 {connectedUsers.length} user(s)</span>
      </div>
    </header>
  )
}

export default Header