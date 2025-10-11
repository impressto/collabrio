import React, { useEffect, useState } from 'react'

function FloatingIcon({ id, emoji, username, onComplete }) {
  const [position, setPosition] = useState({
    bottom: 0,
    left: Math.random() * 80 + 10, // Random starting position between 10% and 90%
    opacity: 1
  })
  
  // Store the initial left position for wave calculation
  const [initialLeft] = useState(position.left)
  // Random wave properties for variation - each icon gets unique motion
  const [waveAmplitude] = useState(Math.random() * 15 + 10) // Wave width: 10-25px side-to-side
  const [waveFrequency] = useState(Math.random() * 2 + 1.5) // Wave cycles: 1.5-3.5 complete waves during animation

  useEffect(() => {
    // Start the animation immediately
    const animationDuration = 3000 // 3 seconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Calculate wavy horizontal movement using sine wave
      // The wave progresses as the icon moves up, creating a snake-like motion
      const waveOffset = Math.sin(progress * Math.PI * waveFrequency) * waveAmplitude
      
      // Calculate new left position, ensuring it stays within screen bounds
      const newLeft = initialLeft + (waveOffset / window.innerWidth * 100)
      const boundedLeft = Math.max(5, Math.min(95, newLeft)) // Keep between 5% and 95%
      
      setPosition(prev => ({
        ...prev,
        bottom: easeOut * 300, // Float up 300px
        left: boundedLeft, // Wavy horizontal position with bounds
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
  }, [id, onComplete, initialLeft, waveAmplitude, waveFrequency])

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