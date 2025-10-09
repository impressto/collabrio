import React, { useState, useCallback, useEffect } from 'react'

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
  showToast,
  socket
}) {
  const isLiveMode = editorMode === 'live'
  const isDraftMode = editorMode === 'draft'
  
  // Ask AI button state
  const [showAskAI, setShowAskAI] = useState(false)
  const [selectedText, setSelectedText] = useState('')

  // Handle text selection for Ask AI button
  const handleTextSelection = useCallback((e) => {
    const textarea = e.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selection = textarea.value.substring(start, end)
    
    if (selection.length > 0) {
      setSelectedText(selection)
      setShowAskAI(true)
    } else {
      setShowAskAI(false)
      setSelectedText('')
    }
  }, [])

  // Handle Ask AI button click
  const handleAskAI = useCallback(() => {
    if (selectedText && socket && sessionId) {
      // Send the selected text to the socket server for AI processing
      socket.emit('ask-ai', {
        sessionId: sessionId,
        selectedText: selectedText
      })
      
      // Show feedback toast
      showToast(`Asking AI about: "${selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"`)
      
      // Hide the button after clicking
      setShowAskAI(false)
      setSelectedText('')
    } else {
      // Show error if socket is not connected
      showToast('Cannot connect to AI service. Please try again.')
    }
  }, [selectedText, socket, sessionId, showToast])

  // Hide Ask AI button when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't hide if clicking on the Ask AI button itself
      if (e.target.closest('.ask-ai-btn')) return
      
      // Hide the button if clicking outside textarea or if no text is selected
      const activeTextarea = window.document.activeElement
      if (!activeTextarea || !activeTextarea.classList.contains('collaborative-editor')) {
        setShowAskAI(false)
        setSelectedText('')
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAskAI(false)
        setSelectedText('')
      }
    }

    if (showAskAI && typeof window !== 'undefined' && window.document) {
      window.document.addEventListener('click', handleClickOutside)
      window.document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (typeof window !== 'undefined' && window.document) {
        window.document.removeEventListener('click', handleClickOutside)
        window.document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showAskAI])

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
        <div className="tabs-left">
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
        
        {/* Ask AI Button - appears when text is selected */}
        {showAskAI && (
          <button 
            className="ask-ai-btn"
            onClick={handleAskAI}
            title="Ask AI about the selected text"
          >
            🤖 Ask AI
          </button>
        )}
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
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
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
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Compose your draft here privately before adding to the shared document..."
            className="collaborative-editor draft-editor"
          />
        )}
      </div>
    </main>
  )
}

export default Editor