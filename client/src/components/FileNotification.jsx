import React, { useState } from 'react'

function FileNotification({ 
  notification, 
  onDownload, 
  onDismiss, 
  darkTheme 
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      await onDownload(notification.fileId, (progress) => {
        setDownloadProgress(progress);
      });
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) return '💻';
    return '📁';
  };

  return (
    <div className={`file-notification ${darkTheme ? 'dark' : ''}`}>
      <div className="file-notification-header">
        <span className="file-icon">
          {getFileIcon(notification.mimeType)}
        </span>
        <div className="file-info">
          <div className="file-name" title={notification.filename}>
            {notification.filename}
          </div>
          <div className="file-meta">
            {formatFileSize(notification.size)} • from {notification.uploadedBy}
          </div>
        </div>
        <button 
          className="dismiss-btn" 
          onClick={() => onDismiss(notification.fileId)}
          title="Dismiss notification"
        >
          ✕
        </button>
      </div>
      
      <div className="file-notification-actions">
        <button 
          className={`download-btn ${isDownloading ? 'downloading' : ''}`}
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <span className="download-spinner">⏳</span>
              Downloading... {Math.round(downloadProgress)}%
            </>
          ) : (
            <>
              ⬇️ Download
            </>
          )}
        </button>
      </div>
      
      {isDownloading && (
        <div className="download-progress">
          <div 
            className="download-progress-bar" 
            style={{ width: `${downloadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}

export default FileNotification