import React, { useEffect, useState } from 'react'

function FloatingIcon({ id, emoji, username, onComplete }) {
  const [position, setPosition] = useState({
    bottom: 0,
    left: Math.random() * 80 + 10, // Random position between 10% and 90%
    opacity: 1
  })

  useEffect(() => {
    // Start the animation immediately
    const animationDuration = 3000 // 3 seconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setPosition(prev => ({
        ...prev,
        bottom: easeOut * 300, // Float up 300px
        opacity: 1 - progress // Fade out as it goes up
      }))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Animation complete, notify parent to remove this component
        onComplete(id)
      }
    }

    requestAnimationFrame(animate)
  }, [id, onComplete])

  return (
    <div
      className="floating-icon"
      style={{
        position: 'fixed',
        bottom: `${position.bottom}px`,
        left: `${position.left}%`,
        opacity: position.opacity,
        zIndex: 9999,
        pointerEvents: 'none',
        transform: 'translateX(-50%)',
        transition: 'none' // We're handling animation manually
      }}
    >
      <div className="floating-icon-content">
        <div className="floating-emoji">{emoji}</div>
        <div className="floating-username">{username}</div>
      </div>
    </div>
  )
}

export default FloatingIcon