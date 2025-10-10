import React, { useState } from 'react'
import { isValidSchoolNumber, getSchoolName } from '../utils/schoolUtils'

function SchoolAuthModal({ onAuthComplete, onCancel }) {
  const [schoolNumber, setSchoolNumber] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const trimmedNumber = schoolNumber.trim()
    
    if (!trimmedNumber) {
      setError('Please enter your school registration number')
      return
    }

    if (!/^\d{6}$/.test(trimmedNumber)) {
      setError('School registration number must be 6 digits')
      return
    }

    setIsValidating(true)

    try {
      // Validate with server
      const response = await fetch(`${import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:4244'}/validate-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ schoolNumber: trimmedNumber })
      })

      const result = await response.json()

      if (result.valid) {
        // Store in localStorage for future use
        localStorage.setItem('collabrio-school-auth', trimmedNumber)
        onAuthComplete(trimmedNumber)
      } else {
        setError('Invalid school registration number. Please check with your teacher.')
      }
    } catch (error) {
      console.error('School validation error:', error)
      setError('Unable to validate school registration. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="school-auth-overlay">
      <div className="school-auth-modal">
        <div className="school-auth-header">
          <h2>🏫 School Authentication</h2>
          <p>Please enter your school registration number to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="school-auth-form">
          <div className="form-group">
            <label htmlFor="school-number">School Registration Number:</label>
            <input
              id="school-number"
              type="text"
              value={schoolNumber}
              onChange={(e) => {
                setSchoolNumber(e.target.value)
                setError('') // Clear error when user types
              }}
              placeholder="Enter 6-digit school number"
              maxLength="6"
              pattern="[0-9]{6}"
              disabled={isValidating}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-button"
              disabled={isValidating}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isValidating}
            >
              {isValidating ? '🔄 Validating...' : '✅ Continue'}
            </button>
          </div>
        </form>
        
        <div className="school-auth-footer">
          <p>
            <strong>Note:</strong> Only students from authorized schools can use this collaborative tool.
            If you don't have a school registration number, please contact your teacher.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SchoolAuthModal