import React from 'react'

function Toast({ toast }) {
  if (!toast.show) return null

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.message}
    </div>
  )
}

export default Toast