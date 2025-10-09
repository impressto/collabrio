import React from 'react'

function UserList({ users, currentUserId, isConnected }) {
  if (!isConnected || users.length === 0) {
    return (
      <div className="user-list">
        <span className="connection-status disconnected">
          🔴 Disconnected
        </span>
      </div>
    )
  }

  return (
    <div className="user-list">
      <span className="connection-status connected">
        🟢 Connected
      </span>
      <div className="users-container">
        <span className="users-label">Collaborators:</span>
        <div className="users-list">
          {users.map((user, index) => (
            <div
              key={user.id || index}
              className={`user-item ${user.id === currentUserId ? 'current-user' : ''}`}
              title={`${user.username}${user.id === currentUserId ? ' (You)' : ''}`}
            >
              <span className="user-avatar">{user.avatar || '👤'}</span>
              <span className="user-name">
                {user.username || 'Anonymous'}
                {user.id === currentUserId && <span className="you-indicator"> (You)</span>}
              </span>
            </div>
          ))}
        </div>
        <span className="user-count">{users.length} user{users.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

export default UserList