import React from 'react'
import { config } from '../config.js'
import UserList from './UserList'

function Header({ isConnected, connectedUsers, currentUserId, schoolName, onInsertUsername }) {
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
        <UserList 
          users={connectedUsers} 
          currentUserId={currentUserId}
          isConnected={isConnected}
          schoolName={schoolName}
          onInsertUsername={onInsertUsername}
        />
      </div>
    </header>
  )
}

export default Header