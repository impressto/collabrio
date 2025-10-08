#!/usr/bin/env node

// Script to generate test-config.js from environment variables
// This allows standalone HTML files to use Vite environment variables

const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, 'client', '.env') })

const config = {
    socketServerUrl: process.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3000',
    debug: process.env.VITE_DEBUG === 'true' || process.env.NODE_ENV === 'development',
    sessionKeepAliveInterval: parseInt(process.env.VITE_SESSION_KEEPALIVE_INTERVAL) || 30000,
    reconnectionAttempts: parseInt(process.env.VITE_RECONNECTION_ATTEMPTS) || 5
}

const configContent = `// Auto-generated configuration for standalone HTML files
// This file is generated from .env variables during build
// Generated on: ${new Date().toISOString()}

const COLLABRIO_CONFIG = ${JSON.stringify(config, null, 4)}

// Make available globally
window.COLLABRIO_CONFIG = COLLABRIO_CONFIG

console.log('Collabrio config loaded:', COLLABRIO_CONFIG)
`

// Write the config file
fs.writeFileSync(path.join(__dirname, 'test-config.js'), configContent)

console.log('✅ Generated test-config.js with environment variables:')
console.log(config)