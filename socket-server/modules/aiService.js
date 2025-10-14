const { CohereClientV2 } = require('cohere-ai');

class AIService {
  constructor() {
    this.cohere = new CohereClientV2({ 
      token: process.env.COHERE_API_KEY || null
    });
  }

  async processAIRequest(selectedText, sessionId, sessionManager, socket, io) {
    if (!selectedText || selectedText.trim() === '') {
      console.error('No selected text provided for AI request');
      return;
    }
    
    console.log(`AI request in session ${sessionId} for text: "${selectedText.substring(0, 100)}..."`);
    
    // Get current document content
    const currentDocument = sessionManager.getSessionDocument(sessionId) || '';
    
    // First, append "Asking AI ... waiting for response" to the document
    const initialResponse = '\n\n[AI Query: "' + selectedText.trim() + '"]\nAsking AI ... waiting for response\n';
    const waitingDocument = currentDocument + initialResponse;
    
    // Store and broadcast the "waiting" state
    sessionManager.setSessionDocument(sessionId, waitingDocument);
    io.to(sessionId).emit('document-update', {
      document: waitingDocument,
      updatedBy: 'ai-system',
      timestamp: Date.now()
    });
    
    try {
      // Call Cohere AI API with short response instruction
      const shortResponsePrompt = "Please provide a concise, brief response (3-5 sentences maximum). " + selectedText.trim();
      
      const response = await this.cohere.chat({
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": shortResponsePrompt
              }
            ]
          }
        ],
        temperature: 0.3,
        model: process.env.COHERE_MODEL || "command-a-03-2025",
        safety_mode: "STRICT"
      });
      
      // Log Cohere API response metadata (excluding message content for debugging)
      const responseMetadata = {
        ...response,
        message: response.message ? {
          role: response.message.role,
          contentType: response.message.content?.[0]?.type,
          contentLength: response.message.content?.[0]?.text?.length || 0
        } : null
      };
      console.log('Cohere API Response Metadata:', JSON.stringify(responseMetadata, null, 2));
      
      // Extract the AI response text
      const aiResponseText = response.message?.content?.[0]?.text || 'AI response unavailable';
      
      // Replace "waiting for response" with actual AI response
      const finalResponse = '\n\n[AI Query: "' + selectedText.trim() + '"]\n[AI Response: ' + aiResponseText + ']\n';
      const finalDocument = currentDocument + finalResponse;
      
      // Store and broadcast the final response
      sessionManager.setSessionDocument(sessionId, finalDocument);
      io.to(sessionId).emit('document-update', {
        document: finalDocument,
        updatedBy: 'ai-system',
        timestamp: Date.now()
      });
      
      console.log(`AI response delivered to session ${sessionId}`);
      
    } catch (error) {
      console.error('Cohere AI API error:', error);
      
      // Replace "waiting for response" with error message
      const errorResponse = '\n\n[AI Query: "' + selectedText.trim() + '"]\n[AI Error: Unable to get AI response. Please try again.]\n';
      const errorDocument = currentDocument + errorResponse;
      
      // Store and broadcast the error
      sessionManager.setSessionDocument(sessionId, errorDocument);
      io.to(sessionId).emit('document-update', {
        document: errorDocument,
        updatedBy: 'ai-system',
        timestamp: Date.now()
      });
    }
  }

  async processDirectAIRequest(selectedText, requestId, socket) {
    if (!selectedText || selectedText.trim() === '') {
      console.error('No selected text provided for direct AI request');
      return;
    }
    
    console.log(`Direct AI request with requestId ${requestId} for text: "${selectedText.substring(0, 100)}..."`);
    
    try {
      // Call Cohere AI API with short response instruction
      const shortResponsePrompt = "Please provide a concise, brief response (3-5 sentences maximum). " + selectedText.trim();
      
      const response = await this.cohere.chat({
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": shortResponsePrompt
              }
            ]
          }
        ],
        temperature: 0.3,
        model: process.env.COHERE_MODEL || "command-a-03-2025",
        safety_mode: "STRICT"
      });
      
      // Extract the AI response text
      let aiResponseText = response.message?.content?.[0]?.text || 'AI response unavailable';
      
      // Remove surrounding quotes if they exist
      aiResponseText = aiResponseText.trim();
      if ((aiResponseText.startsWith('"') && aiResponseText.endsWith('"')) ||
          (aiResponseText.startsWith("'") && aiResponseText.endsWith("'"))) {
        aiResponseText = aiResponseText.slice(1, -1);
      }
      
      console.log(`Direct AI response ready for requestId ${requestId}`);
      
      // Send the response directly back to the requesting client (not to the entire session)
      socket.emit('ai-response-direct', {
        requestId: requestId,
        response: aiResponseText,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Cohere AI API error for direct request:', error);
      
      // Send error response back to the requesting client
      socket.emit('ai-response-direct', {
        requestId: requestId,
        response: 'Unable to generate icebreaker. Please try again.',
        error: true,
        timestamp: Date.now()
      });
    }
  }
}

module.exports = AIService;