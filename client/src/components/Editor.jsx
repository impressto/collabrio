import React from 'react'

function Editor({ 
  textareaRef, 
  sessionId, 
  document, 
  handleDocumentChange, 
  showToast 
}) {
  return (
    <main className="editor-container">
      <div className="editor-wrapper">
        <button 
          className="copy-icon-btn" 
          onClick={() => {
            navigator.clipboard.writeText(document)
            showToast('Document content copied to clipboard!')
          }}
          title="Copy document content"
        >
          ⧉
        </button>
        <textarea
          id="collaborative-editor"
          ref={textareaRef}
          key={`textarea-${sessionId}`}
          value={document}
          onChange={handleDocumentChange}
          placeholder="Start typing your collaborative document here..."
          className="collaborative-editor"
        />
      </div>
    </main>
  )
}

export default Editor