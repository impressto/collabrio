import React, { useState, useCallback, useEffect, useRef } from 'react'
import config from '../config.js'
import { audioManager } from '../utils/audioUtils.js'

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
  
  // Character limit helpers
  const getCharacterCount = (text) => text.length
  const isNearLimit = (text) => text.length > config.maxDocumentChars * 0.9 // 90% warning
  const isAtLimit = (text) => text.length >= config.maxDocumentChars
  const getRemainingChars = (text) => Math.max(0, config.maxDocumentChars - text.length)

  // Handle paste events to prevent exceeding character limit
  const handlePaste = useCallback((e) => {
    const pastedText = e.clipboardData.getData('text/plain')
    const currentContent = isLiveMode ? document : draftContent
    const textarea = e.target
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    
    // Calculate what the content would be after pasting
    const beforePaste = currentContent.substring(0, selectionStart)
    const afterPaste = currentContent.substring(selectionEnd)
    const newContent = beforePaste + pastedText + afterPaste
    
    // Check if the new content would exceed the limit
    if (newContent.length > config.maxDocumentChars) {
      e.preventDefault() // Prevent the paste
      
      // Calculate how much can still be pasted
      const remainingSpace = config.maxDocumentChars - (beforePaste.length + afterPaste.length)
      const truncatedPaste = pastedText.substring(0, remainingSpace)
      
      if (remainingSpace > 0) {
        // Paste only what fits
        const newTruncatedContent = beforePaste + truncatedPaste + afterPaste
        if (isLiveMode) {
          handleDocumentChange({ target: { value: newTruncatedContent } })
        } else {
          handleDraftChange({ target: { value: newTruncatedContent } })
        }
        
        // Position cursor after the truncated paste
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + truncatedPaste.length
        }, 0)
        
        showToast(`Paste truncated: Document limit is ${config.maxDocumentChars.toLocaleString()} characters`, 'warning')
      } else {
        showToast(`Cannot paste: Document limit of ${config.maxDocumentChars.toLocaleString()} characters reached`, 'error')
      }
      
      setShowCharacterLimit(true)
      setTimeout(() => setShowCharacterLimit(false), 3000)
    }
  }, [document, draftContent, isLiveMode, handleDocumentChange, handleDraftChange, showToast])

  // Handle key presses to prevent typing when at character limit
  const handleKeyPress = useCallback((e) => {
    const currentContent = isLiveMode ? document : draftContent
    const textarea = e.target
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const hasSelection = selectionStart !== selectionEnd
    
    // Allow if we have selected text (typing will replace it)
    // Allow backspace, delete, arrow keys, etc.
    if (hasSelection || 
        e.key === 'Backspace' || 
        e.key === 'Delete' || 
        e.key === 'ArrowLeft' || 
        e.key === 'ArrowRight' || 
        e.key === 'ArrowUp' || 
        e.key === 'ArrowDown' ||
        e.ctrlKey || 
        e.metaKey) {
      return
    }
    
    // Prevent typing if at character limit
    if (isAtLimit(currentContent)) {
      e.preventDefault()
      showToast(`Character limit of ${config.maxDocumentChars.toLocaleString()} reached`, 'warning')
      setShowCharacterLimit(true)
      setTimeout(() => setShowCharacterLimit(false), 2000)
    }
  }, [document, draftContent, isLiveMode, showToast])

  // Ask AI button state
  const [showAskAI, setShowAskAI] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [textTooLong, setTextTooLong] = useState(false)
  const [isWaitingForAI, setIsWaitingForAI] = useState(false)
  const [aiResponseCountAtStart, setAiResponseCountAtStart] = useState(null)
  const [askAiCooldown, setAskAiCooldown] = useState(0)
  const [askAiCooldownTimer, setAskAiCooldownTimer] = useState(null)

  // Character limit state
  const [showCharacterLimit, setShowCharacterLimit] = useState(false)
  
  // No need for audio refs when using audioManager

  // Handle text selection for Ask AI button
  const handleTextSelection = useCallback((e) => {
    const textarea = e.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selection = textarea.value.substring(start, end)
    
    if (selection.length > 0) {
      if (selection.length <= config.askAiMaxChars) {
        // Selection is within limit - show Ask AI button
        setSelectedText(selection)
        setShowAskAI(true)
        setTextTooLong(false)
      } else {
        // Selection is too long - show warning message instead
        setSelectedText('')
        setShowAskAI(false)
        setTextTooLong(true)
      }
    } else {
      // No selection - hide everything
      setShowAskAI(false)
      setSelectedText('')
      setTextTooLong(false)
    }
  }, [])

  // Handle Ask AI button click
  const handleAskAI = useCallback(() => {
    // Check if button is on cooldown
    if (askAiCooldown > 0) {
      return
    }
    
    if (selectedText && socket && sessionId) {
      // Start 15-second cooldown
      setAskAiCooldown(15)
      
      // Clear any existing timer
      if (askAiCooldownTimer) {
        clearInterval(askAiCooldownTimer)
      }
      
      // Start countdown timer
      const timer = setInterval(() => {
        setAskAiCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setAskAiCooldownTimer(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      setAskAiCooldownTimer(timer)
      
      // Count current number of AI responses in the document
      const currentResponseCount = (document.match(/\[AI Response:/g) || []).length
      
      // Start waiting state and audio
      setIsWaitingForAI(true)
      setAiResponseCountAtStart(currentResponseCount)
      
      // Start playing the timer audio in loop using audioManager
      audioManager.play('timer', {
        loop: true,
        volume: config.audioVolume || 0.8
      })
      
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
  }, [selectedText, socket, sessionId, showToast, askAiCooldown, askAiCooldownTimer, document])

  // Hide Ask AI button when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't hide if clicking on the Ask AI button itself
      if (e.target.closest('.ask-ai-btn') || e.target.closest('.text-too-long-warning')) return
      
      // Hide the button if clicking outside textarea or if no text is selected
      const activeTextarea = window.document.activeElement
      if (!activeTextarea || !activeTextarea.classList.contains('collaborative-editor')) {
        setShowAskAI(false)
        setSelectedText('')
        setTextTooLong(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAskAI(false)
        setSelectedText('')
        setTextTooLong(false)
      }
    }

    if ((showAskAI || textTooLong) && typeof window !== 'undefined' && window.document) {
      window.document.addEventListener('click', handleClickOutside)
      window.document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (typeof window !== 'undefined' && window.document) {
        window.document.removeEventListener('click', handleClickOutside)
        window.document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showAskAI, textTooLong])

  // Stop audio when a new AI response is added
  useEffect(() => {
    if (isWaitingForAI && document && aiResponseCountAtStart !== null) {
      // Count current number of AI responses in the document
      const currentResponseCount = (document.match(/\[AI Response:/g) || []).length
      const hasNewResponse = currentResponseCount > aiResponseCountAtStart
      
      if (hasNewResponse) {
        
        // Stop the timer audio using audioManager
        audioManager.stop('timer')
        
        setIsWaitingForAI(false)
        setAiResponseCountAtStart(null)
      }
    }
  }, [document, isWaitingForAI, aiResponseCountAtStart])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (askAiCooldownTimer) {
        clearInterval(askAiCooldownTimer)
      }
    }
  }, [])

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
        
        {/* Ask AI Button - appears when text is selected and under 500 characters */}
        {showAskAI && (
          <button 
            className={`ask-ai-btn ${askAiCooldown > 0 ? 'disabled' : ''}`}
            onClick={handleAskAI}
            disabled={askAiCooldown > 0}
            title={askAiCooldown > 0 ? `Please wait ${askAiCooldown} seconds` : "Ask AI about the selected text"}
          >
            🤖 {askAiCooldown > 0 ? `Ask AI (${askAiCooldown}s)` : 'Ask AI'}
          </button>
        )}
        
        {/* Warning message when selected text is too long */}
        {textTooLong && (
          <div 
            className="text-too-long-warning"
            title={`Please select ${config.askAiMaxChars} characters or less to use Ask AI`}
          >
            ⚠️ Text too long ({config.askAiMaxChars} char limit)
          </div>
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
            onKeyDown={(e) => {
              handleKeyDown(e)
              handleKeyPress(e)
            }}
            onPaste={handlePaste}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Start typing your doc here. Highlight something to toss it into the AI blender..."
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
            onKeyDown={(e) => {
              handleKeyDown(e)
              handleKeyPress(e)
            }}
            onPaste={handlePaste}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Compose your draft here privately before adding to the shared document..."
            className="collaborative-editor draft-editor"
          />
        )}

        {/* Character Counter */}
        <div className={`character-counter ${isNearLimit(isLiveMode ? document : draftContent) ? 'warning' : ''} ${isAtLimit(isLiveMode ? document : draftContent) ? 'error' : ''} ${showCharacterLimit ? 'highlighted' : ''}`}>
          <span className="counter-text">
            {getCharacterCount(isLiveMode ? document : draftContent).toLocaleString()} / {config.maxDocumentChars.toLocaleString()} characters
            {isNearLimit(isLiveMode ? document : draftContent) && !isAtLimit(isLiveMode ? document : draftContent) && (
              <span className="warning-text"> ({getRemainingChars(isLiveMode ? document : draftContent)} remaining)</span>
            )}
            {isAtLimit(isLiveMode ? document : draftContent) && (
              <span className="limit-text"> (LIMIT REACHED)</span>
            )}
          </span>
        </div>
      </div>
    </main>
  )
}

export default Editor