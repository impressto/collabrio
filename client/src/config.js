// Configuration utility for Collabrio
// This provides a consistent way to access environment variables

export const config = {
  // Socket server configuration
  socketServerUrl: import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3000',
  
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