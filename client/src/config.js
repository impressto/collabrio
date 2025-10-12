// Configuration utility for Collabrio
// This provides a consistent way to access environment variables

export const config = {
  // Socket server configuration
  socketServerUrl: import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3000',
  
  // Asset configuration
  baseUrl: import.meta.env.VITE_BASE_URL || 'https://impressto.ca/collabrio',
  logoUrl: import.meta.env.VITE_LOGO_URL || 'https://impressto.ca/collabrio/client/public/collaborio.png',
  
  // Audio configuration
  audioVolume: parseFloat(import.meta.env.VITE_AUDIO_VOLUME) || 0.8,
  soundEffectsEnabled: import.meta.env.VITE_SOUND_EFFECTS !== 'false',
  soundEffectsVolume: parseFloat(import.meta.env.VITE_SOUND_EFFECTS_VOLUME) || 0.5,
  
  // AI configuration
  askAiMaxChars: parseInt(import.meta.env.VITE_ASK_AI_MAX_CHARS) || 500,
  
  // Document limits
  maxDocumentChars: parseInt(import.meta.env.VITE_MAX_DOCUMENT_CHARS) || 20000,
  
  // Debug configuration
  debug: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.DEV,
  
  // Connection settings
  reconnectionAttempts: parseInt(import.meta.env.VITE_RECONNECTION_ATTEMPTS) || 5,
  sessionKeepAliveInterval: parseInt(import.meta.env.VITE_SESSION_KEEPALIVE_INTERVAL) || 30000,
  
  // Environment info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE
}

// Log configuration in development
if (config.debug) {
  console.log('Collabrio Configuration:', config)
}

export default config