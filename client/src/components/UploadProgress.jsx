import React from 'react'

function UploadProgress({ 
  isUploading, 
  filename, 
  progress, 
  onCancel, 
  darkTheme 
}) {
  if (!isUploading) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-progress-overlay">
      <div className={`upload-progress-modal ${darkTheme ? 'dark' : ''}`}>
        <h3>Uploading File</h3>
        
        <div className="upload-file-info">
          📎 {filename}
        </div>
        
        <div className="upload-progress">
          <div 
            className="upload-progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="upload-progress-text">
          {Math.round(progress)}% complete
        </div>
        
        <button 
          className="upload-cancel-btn" 
          onClick={onCancel}
          disabled={progress >= 100}
        >
          Cancel Upload
        </button>
      </div>
    </div>
  );
}

export default UploadProgress