import React from 'react'
import { config } from '../config.js'

function LandingPage({ darkTheme, createNewSession, joinExistingSession }) {
  return (
    <div className="collabrio-app dark-theme">
      <div className="collabrio-container">
        <div className="landing-page">
          <header className="landing-header">
            <h1>
              <img 
                src={config.logoUrl} 
                alt="Collabrio" 
                style={{width: '56px', height: '56px', marginRight: '12px', verticalAlign: 'middle'}} 
              />
              Collabrio
            </h1>
            <p>Real-time collaborative clipboard</p>
          </header>
          
          <div className="landing-content">
            <div className="session-actions">
              <button 
                id="create-session-btn" 
                onClick={createNewSession} 
                className="create-session-button"
              >
                ✨ Create New Session
              </button>
              
              <div className="join-session-section">
                <p>or join an existing session:</p>
                <input
                  id="join-session-input"
                  type="text"
                  placeholder="Enter session ID..."
                  className="join-session-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const sessionIdToJoin = e.target.value.trim()
                      if (sessionIdToJoin) {
                        joinExistingSession(sessionIdToJoin)
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage