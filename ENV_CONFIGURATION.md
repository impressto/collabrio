# Environment Configuration

Collabrio uses Vite's environment variable system for configuration. This allows you to customize settings for different environments (development, production, testing).

## Setting up Environment Variables

### 1. Client Configuration

Copy the example environment file:
```bash
cd client
cp .env.example .env
```

Edit the `.env` file to match your setup:
```bash
# Socket server URL (must start with VITE_ to be available in the browser)
VITE_SOCKET_SERVER_URL=http://localhost:3000

# Other configuration
VITE_DEBUG=true
VITE_RECONNECTION_ATTEMPTS=5
VITE_SESSION_KEEPALIVE_INTERVAL=30000
```

### 2. Available Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_SOCKET_SERVER_URL` | Socket.IO server URL | `http://localhost:3000` | `https://socket.impressto.ca` |
| `VITE_DEBUG` | Enable debug logging | `true` in dev, `false` in prod | `true` |
| `VITE_RECONNECTION_ATTEMPTS` | Socket reconnection attempts | `5` | `10` |
| `VITE_SESSION_KEEPALIVE_INTERVAL` | Session keepalive interval (ms) | `30000` | `60000` |

### 3. Environment-Specific Files

- `.env` - Default environment variables
- `.env.development` - Development-specific overrides
- `.env.production` - Production-specific overrides
- `.env.local` - Local overrides (ignored by git)

### 4. Using in Code

```javascript
// In React components
import config from './config.js'

// Access environment variables
console.log(config.socketServerUrl) // Uses VITE_SOCKET_SERVER_URL
console.log(config.debug) // Uses VITE_DEBUG
```

### 5. Test Files and Standalone HTML

For standalone HTML files (like test-session.html), run the config generator:

```bash
# Generate test-config.js from environment variables
npm run generate-config

# Or manually
node generate-test-config.js
```

This creates a `test-config.js` file that standalone HTML files can include:

```html
<script src="test-config.js"></script>
<script>
    const socket = io(window.COLLABRIO_CONFIG.socketServerUrl)
</script>
```

## Production Deployment

For production, create a `.env.production` file:

```bash
# Production configuration
VITE_SOCKET_SERVER_URL=https://socket.impressto.ca
VITE_DEBUG=false
VITE_RECONNECTION_ATTEMPTS=10
VITE_SESSION_KEEPALIVE_INTERVAL=30000
```

The build process will automatically use these values when building for production.

## Development Workflow

1. Set up your environment variables in `.env`
2. Generate config for test files: `npm run generate-config`
3. Start development: `npm run dev`

The configuration will be automatically loaded and made available throughout the application.