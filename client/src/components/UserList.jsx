import React from 'react'

function UserList({ users, currentUserId, isConnected, schoolName, onInsertUsername }) {
  const getUsersLabel = () => {
    if (schoolName) {
      return `${schoolName}:`
    }
    return 'Users:'
  }

  const handleUserClick = (user) => {
    // Don't insert your own username
    if (user.id === currentUserId || !onInsertUsername) return
    
    const username = user.username || 'Anonymous'
    onInsertUsername(`@${username} `)
  }

  if (!isConnected || users.length === 0) {
    return (
      <div className="user-list">
        <span className="users-label">{schoolName ? `${schoolName}: No users` : 'No users'}</span>
      </div>
    )
  }

  return (
    <div className="user-list">
      <div className="users-container">
        <span className="users-label">{getUsersLabel()}</span>
        <div className="users-list">
          {users.map((user, index) => (
            <div
              key={user.id || index}
              className={`user-item ${user.id === currentUserId ? 'current-user' : ''} ${user.id !== currentUserId ? 'clickable' : ''}`}
              title={`${user.username}${user.id === currentUserId ? ' (You)' : ' - Click to mention'}`}
              onClick={() => handleUserClick(user)}
            >
              <span className="user-avatar">{user.avatar || '👤'}</span>
              <span className="user-name">
                {user.username || 'Anonymous'}
                {user.id === currentUserId && <span className="you-indicator"> (You)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserList