import React from 'react'

function Editor({ 
  textareaRef,
  draftRef,
  sessionId, 
  document,
  draftContent,
  editorMode,
  setEditorMode,
  handleDocumentChange,
  handleDraftChange,
  addDraftToLive,
  copyDraftContent,
  clearDraft,
  showToast 
}) {
  const isLiveMode = editorMode === 'live'
  const isDraftMode = editorMode === 'draft'

  // Handle tab key in textareas
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      
      const textarea = e.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      // Insert tab character at cursor position
      const newValue = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end)
      
      // Update the appropriate state based on editor mode
      if (isLiveMode) {
        // Create synthetic event for live editor
        const syntheticEvent = {
          target: { value: newValue }
        }
        handleDocumentChange(syntheticEvent)
      } else {
        // Create synthetic event for draft editor
        const syntheticEvent = {
          target: { value: newValue }
        }
        handleDraftChange(syntheticEvent)
      }
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      }, 0)
    }
  }

  return (
    <main className="editor-container">
      {/* Tab Navigation */}
      <div className="editor-tabs">
        <button 
          className={`tab-button ${isLiveMode ? 'active' : ''}`}
          onClick={() => setEditorMode('live')}
        >
          📡 Live
        </button>
        <button 
          className={`tab-button ${isDraftMode ? 'active' : ''}`}
          onClick={() => setEditorMode('draft')}
        >
          📝 Draft {draftContent.trim() && <span className="draft-indicator">●</span>}
        </button>
      </div>

      <div className={`editor-wrapper ${isDraftMode ? 'draft-mode' : ''}`}>
        {/* Copy Button - changes function based on mode */}
        <button 
          className="copy-icon-btn" 
          onClick={() => {
            if (isLiveMode) {
              navigator.clipboard.writeText(document)
              showToast('Live document copied to clipboard!')
            } else {
              copyDraftContent()
            }
          }}
          title={isLiveMode ? "Copy live document content" : "Copy draft content"}
        >
          ⧉
        </button>

        {/* Draft Mode Buttons */}
        {isDraftMode && draftContent.trim() && (
          <>
            <button 
              className="add-draft-btn" 
              onClick={addDraftToLive}
              title="Add draft to live document"
            >
              ➕
            </button>
            <button 
              className="clear-draft-btn" 
              onClick={clearDraft}
              title="Clear draft content"
            >
              🗑️
            </button>
          </>
        )}

        {/* Live Editor */}
        {isLiveMode && (
          <textarea
            id="collaborative-editor"
            ref={textareaRef}
            key={`textarea-${sessionId}`}
            value={document}
            onChange={handleDocumentChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing your collaborative document here..."
            className="collaborative-editor"
          />
        )}

        {/* Draft Editor */}
        {isDraftMode && (
          <textarea
            id="draft-editor"
            ref={draftRef}
            value={draftContent}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder="Compose your draft here privately before adding to the shared document..."
            className="collaborative-editor draft-editor"
          />
        )}
      </div>
    </main>
  )
}

export default Editor