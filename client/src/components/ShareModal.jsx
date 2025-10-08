import React from 'react'
import QRCode from 'react-qr-code'

function ShareModal({ showQRModal, setShowQRModal, getCurrentUrl, copyToClipboard }) {
  if (!showQRModal) return null

  return (
    <div id="qr-modal-overlay" className="modal-overlay" onClick={() => setShowQRModal(false)}>
      <div id="qr-modal-content" className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Share This Session</h3>
        <div className="qr-container">
          <QRCode
            id="qr-code"
            size={200}
            value={getCurrentUrl()}
            viewBox="0 0 256 256"
          />
        </div>
        <p>Scan this QR code or share the link:</p>
        <input
          id="share-link-input"
          type="text"
          value={getCurrentUrl()}
          readOnly
          className="share-link"
          onClick={(e) => e.target.select()}
        />
        <div className="modal-buttons">
          <button id="modal-copy-btn" onClick={copyToClipboard}>Copy Link</button>
          <button id="modal-close-btn" onClick={() => setShowQRModal(false)}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal