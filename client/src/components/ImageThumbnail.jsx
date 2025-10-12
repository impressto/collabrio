import { useState } from 'react'

function ImageThumbnail({ image, onRemove, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleThumbnailClick = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setShowDeleteConfirm(false)
  }

  const handleDownload = () => {
    try {
      // Create download link from base64 data
      const link = document.createElement('a')
      link.href = `data:${image.mimeType};base64,${image.data}`
      link.download = image.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete(image)
    }
    setShowDeleteConfirm(false)
    setShowModal(false)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Create image src from base64 data
  const imageSrc = `data:${image.mimeType};base64,${image.data}`

  return (
    <>
      {/* Thumbnail in toolbar */}
      <img
        src={imageSrc}
        alt={image.filename}
        className="image-thumbnail"
        onClick={handleThumbnailClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        title={`${image.filename} - Click to view full size`}
      />

      {/* Modal popup */}
      {showModal && (
        <div className="image-modal-overlay" onClick={handleCloseModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3 className="image-modal-title" title={image.filename}>
                {image.filename}
              </h3>
              <button 
                className="image-modal-close"
                onClick={handleCloseModal}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="image-modal-content">
              {imageLoading && (
                <div className="image-loading">
                  Loading image...
                </div>
              )}
              
              {imageError && (
                <div className="image-error">
                  <div className="image-error-icon">🖼️</div>
                  <div>Failed to load image</div>
                </div>
              )}
              
              {!imageError && (
                <img
                  src={imageSrc}
                  alt={image.filename}
                  className="image-modal-image"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
              
              <div className="image-modal-info">
                <div><strong>Shared by:</strong> {image.sender}</div>
                <div><strong>Size:</strong> {formatFileSize(image.size)}</div>
                <div><strong>Time:</strong> {formatTimestamp(image.timestamp)}</div>
              </div>
              
              <div className="image-modal-actions">
                <button 
                  className="image-download-btn"
                  onClick={handleDownload}
                  title="Download image"
                >
                  💾 Download
                </button>
                {onDelete && (
                  <button 
                    className="image-delete-btn"
                    onClick={handleDeleteClick}
                    title="Delete from cache"
                  >
                    🗑️ Delete
                  </button>
                )}
                <button 
                  className="image-close-btn"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>

              {/* Delete Confirmation Dialog */}
              {showDeleteConfirm && (
                <div className="delete-confirm-overlay">
                  <div className="delete-confirm-dialog">
                    <h4>Delete Image</h4>
                    <p>Are you sure you want to delete "{image.filename}" from the server cache?</p>
                    <p className="delete-warning">This will remove it for all session participants.</p>
                    <div className="delete-confirm-actions">
                      <button 
                        className="confirm-delete-btn"
                        onClick={handleConfirmDelete}
                      >
                        Delete
                      </button>
                      <button 
                        className="cancel-delete-btn"
                        onClick={handleCancelDelete}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ImageThumbnail