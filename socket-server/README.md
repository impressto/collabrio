# Collabrio WebRTC Socket Server

This is a Node.js WebSocket server that handles WebRTC signaling for the Collabrio text sharing application. It replaces the PHP-based signaling endpoints with a more efficient real-time communication system using Socket.IO.

## Features

- **Real-time Collaboration**: WebSocket-based document synchronization
- **AI Integration**: Cohere AI-powered text analysis and responses
- **Session Management**: Anonymous sessions with URL hash-based access
- **Client Presence Tracking**: Live user count and connection status
- **Text Injection**: REST API and file-based message injection
- **File Watching**: Automated message processing from file system
- **File Sharing (Phase 1)**: Ephemeral file sharing with 5-minute timeout
- **QR Code Integration**: Easy session sharing via QR codes
- **WebRTC Ready**: Prepared for P2P enhancement
- **Production Ready**: PM2 process management support

## Requirements

- Node.js 14+ (16+ recommended)
- npm or yarn

## Installation

1. Install dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn install
```

2. Configure environment variables:
   - Create a `.env` file in this directory with:
   ```
   PORT=4244
   COHERE_API_KEY=your_cohere_api_key_here
   COHERE_MODEL=command-a-03-2025
   ```
   - **PORT**: Server port (default: 4244)
   - **COHERE_API_KEY**: Required for AI functionality (get from https://cohere.com)
   - **COHERE_MODEL**: Cohere AI model to use (default: command-a-03-2025)

## Running the Server

Start the server in development mode (with auto-restart):

```bash
npm run dev
```

Start the server in production mode:

```bash
npm start
```

## Testing Server Connection

You can test if the socket server is running and responding using these commands:

### Quick Health Check
```bash
# Test if server is responding (returns HTTP headers only)
curl -I http://localhost:4244/status

# Get full status response with JSON
curl http://localhost:4244/status
```

### Expected Response
When the server is running correctly, you should see:
```json
{
  "status": "success",
  "message": "WebRTC Socket server is running",
  "activeSessions": []
}
```

### Check if Port is Listening
```bash
# Check if the server is listening on the configured port
ss -tulpn | grep :4244

# Alternative command (if netstat is available)
netstat -tulpn | grep :4244
```

### Admin Interface Test
```bash
# Test admin interface accessibility
curl -I http://localhost:4244/admin
```

**Note:** Replace `4244` with your configured port number from the `.env` file.

## API Endpoints

- `GET /status` - Check server status and get active sessions
- `POST /inject-text` - Inject text into an active session
- `GET /debug/sessions` - View active sessions and connected clients (debug endpoint)
- `POST /upload-file` - Upload a file to share with session participants (Phase 1)
- `GET /download-file/:fileId` - Download a shared file by ID (Phase 1)

### REST API Text Injection Examples

**Check active sessions:**
```bash
curl http://localhost:3000/debug/sessions
```

**Inject text using POST method:**
```bash
# Basic system message
curl -X POST http://localhost:3000/inject-text \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "abc123", "text": "Hello from REST API!"}'

# Bot message with specific type
curl -X POST http://localhost:3000/inject-text \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "abc123", "text": "🤖 Bot message via API", "type": "bot"}'

# Alert message
curl -X POST http://localhost:3000/inject-text \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "abc123", "text": "⚠️ System alert!", "type": "alert"}'

# Multi-line message
curl -X POST http://localhost:3000/inject-text \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123", 
    "text": "Multi-line message\nSecond line\nThird line", 
    "type": "system"
  }'
```

**Example Responses:**

Success (200):
```json
{
  "status": "success",
  "message": "Text injected into session abc123",
  "sessionId": "abc123",
  "clientsNotified": 2
}
```

Error - Session not found (404):
```json
{
  "status": "error",
  "message": "Session abc123 not found or has no active clients"
}
```

Error - Missing parameters (400):
```json
{
  "status": "error",
  "message": "sessionId and text are required"
}
```

## File-Based Message Injection

The server supports automated message injection through file creation. This enables external scripts and automation tools to send messages to active sessions.

### How it works:

1. **Create a message file** in the `messages/` directory with the naming pattern:
   - `{sessionId}.txt` - Defaults to 'system' message type
   - `{sessionId}_{type}.txt` - Specify message type (e.g., `abc123_bot.txt`)

2. **The file watcher automatically**:
   - Detects the new file
   - Parses the session ID and message type
   - Validates the session is active
   - Injects the message into the session via WebSocket
   - Moves the processed file to `messages/processed/` with timestamp

### Message Types:
- `system` - System notifications (default)
- `bot` - Bot messages
- `user` - User messages
- `alert` - Alert messages

### Example Usage:

```bash
# Send a system message to session 'abc123'
echo "Server maintenance in 5 minutes" > messages/abc123.txt

# Send a bot message
echo "🤖 Hello from automation!" > messages/abc123_bot.txt

# Send an alert
echo "⚠️ High CPU usage detected" > messages/abc123_alert.txt
```

### Directory Structure:
```
messages/
├── processed/          # Processed files (with timestamps)
└── [session files]     # Files to be processed
```

## Socket Events

The server uses Socket.IO for real-time communication. While curl cannot directly interact with Socket.IO events, you can test these using a Socket.IO client or through the web interface.

### Available Socket Events

#### `ask-ai` - AI Query Processing
**Description:** Send selected text to the Cohere AI API and get an intelligent response appended to the document.

**Event Payload:**
```javascript
{
  "sessionId": "abc123",
  "selectedText": "What is machine learning?"
}
```

**Testing with Socket.IO Client:**

Since curl cannot directly connect to Socket.IO, here are alternative testing methods:

**1. Using Node.js Socket.IO Client:**
```javascript
// test-ask-ai.js
const io = require('socket.io-client');

const socket = io('http://localhost:4244');

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Join a session first
  socket.emit('join-session', {
    sessionId: 'test123',
    clientId: 'test-client-1',
    userIdentity: { username: 'TestUser' }
  });
  
  // Send AI request
  socket.emit('ask-ai', {
    sessionId: 'test123',
    selectedText: 'Explain quantum computing in simple terms'
  });
});

socket.on('document-update', (data) => {
  console.log('Document updated:', data);
});
```

**Run the test:**
```bash
node test-ask-ai.js
```

**2. Using curl with Socket.IO REST fallback (if available):**
```bash
# Note: This is a theoretical REST endpoint - the actual implementation uses Socket.IO
# For real testing, use the web interface or Socket.IO client above

curl -X POST http://localhost:4244/socket.io/ \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ask-ai",
    "data": {
      "sessionId": "qkdlfz", 
      "selectedText": "What are the benefits of renewable energy?"
    }
  }'
```

**3. Testing through Web Interface (Recommended):**
1. Open the Collabrio app in your browser
2. Create or join a session
3. Type some text in the document
4. Select any text you want to ask AI about
5. Click the "🤖 Ask AI" button that appears
6. Watch the real-time AI response

**Expected Response Flow:**
1. Initial document update with waiting message:
   ```
   [AI Query: "your selected text"]
   Asking AI ... waiting for response
   ```

2. Final document update with AI response:
   ```
   [AI Query: "your selected text"]
   [AI Response: Detailed AI-generated response from Cohere API]
   ```

**AI Configuration:**
- **Provider:** Cohere AI
- **Model:** Configurable via `COHERE_MODEL` environment variable (default: command-a-03-2025)
- **Temperature:** 0.3 (balanced creativity/consistency)
- **API Key:** Configured via `COHERE_API_KEY` environment variable

## File Sharing API (Phase 1)

### File Upload Endpoint

**Upload a file to share with session participants:**
```bash
curl -X POST http://localhost:4244/upload-file \
  -F "file=@example.pdf" \
  -F "sessionId=abc123" \
  -F "userId=user1"
```

**Parameters:**
- `file` (multipart) - The file to upload (max 10MB)
- `sessionId` (string) - Active session ID
- `userId` (string) - User identifier for rate limiting

**Response:**
```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "fileId": "a1b2c3d4e5f6...",
  "filename": "example.pdf",
  "size": 1024576
}
```

### File Download Endpoint

**Download a shared file:**
```bash
curl "http://localhost:4244/download-file/a1b2c3d4e5f6?sessionId=abc123" \
  -o downloaded_file.pdf
```

**Parameters:**
- `:fileId` (path) - Unique file identifier from upload response
- `sessionId` (query) - Session ID for access validation

### File Sharing Configuration

- **Maximum file size:** 10MB
- **File timeout:** 5 minutes (ephemeral sharing)
- **Rate limit:** 3 uploads per 5 minutes per user
- **Allowed types:** Documents, images, archives, code files
- **Blocked extensions:** .exe, .bat, .sh, .app, .dll, .sys, .scr, .vbs, .jar

## WebSocket Events

### Client to Server

- `join-session` - Join a session with sessionId and clientId
- `document-change` - Send document updates to other clients in session
- `leave-session` - Leave the current session
- `signal` - Send a WebRTC signaling message to another client (future feature)
- `file-share-request` - Request to share a file with session participants (Phase 1)
- `file-chunk` - Send file data chunk during upload (Phase 1)
- `file-download-request` - Request download information for a file (Phase 1)

### Server to Client

- `document-update` - Receive document changes from other clients
- `user-joined` - Notification when a user joins the session
- `user-left` - Notification when a user leaves the session
- `server-text-injection` - Receive injected messages from server/automation
- `signal` - Receive WebRTC signaling messages (future feature)
- `file-available` - Notification when a file is shared in the session (Phase 1)
- `file-share-accepted` - Confirmation that file upload can proceed (Phase 1)
- `file-share-error` - Error during file sharing operation (Phase 1)
- `file-upload-progress` - Progress updates during file upload (Phase 1)
- `file-upload-complete` - Confirmation that file upload finished (Phase 1)
- `file-downloaded` - Notification when someone downloads a file (Phase 1)
- `file-expired` - Notification when a shared file expires (Phase 1)
- `file-download-ready` - Download URL provided for requested file (Phase 1)

## Integration with Collabrio Frontend

To use this WebSocket server with the Collabrio frontend, set the `VITE_SOCKET_SERVER_URL` environment variable in your `.env` or `.env.local` file:

```
VITE_SOCKET_SERVER_URL=http://localhost:3000
```

Then, make sure to import `WebRTCSocketManager.js` instead of `WebRTCManager.js` in your React components.

## Deploying to Production

1. Install dependencies:

```bash
npm install
```

2. **Using PM2 Process Manager (Recommended)**

   PM2 is a production process manager that keeps your application running 24/7 with automatic restarts, clustering, and monitoring.

   ### Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

   ### Start the server with PM2:
   ```bash
   # Basic start
   pm2 start server.js --name collabrio-socket-server

   # With custom configuration
   pm2 start server.js --name collabrio-socket-server --watch --ignore-watch="node_modules messages/processed server.log"
   ```

   ### PM2 Management Commands:
   ```bash
   # View running processes
   pm2 status
   pm2 list

   # View logs
   pm2 logs collabrio-socket-server
   pm2 logs collabrio-socket-server --lines 100

   # Monitor in real-time
   pm2 monit

   # Restart the server
   pm2 restart collabrio-socket-server

   # Stop the server
   pm2 stop collabrio-socket-server

   # Delete from PM2
   pm2 delete collabrio-socket-server

   # Save PM2 configuration
   pm2 save

   # Setup PM2 to start on system boot
   pm2 startup
   pm2 save
   ```

   ### Setting Up PM2 for System Boot (Auto-start)

   To ensure your application automatically starts when the server reboots, follow these steps:

   **🧩 Step 1. Generate the startup script**
   
   Run this command in your terminal:
   ```bash
   pm2 startup
   ```
   
   PM2 will detect your init system (e.g., systemd on Ubuntu) and output a command that looks something like this:
   ```bash
   [PM2] Init System found: systemd
   [PM2] To setup the Startup Script, copy/paste the following command:
   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u yourusername --hp /home/yourusername
   ```

   **🧩 Step 2. Run the command PM2 gives you**
   
   Copy and paste that exact `sudo env PATH=... pm2 startup ...` command and run it.
   
   This creates the necessary startup service so PM2 runs automatically at boot.

   **🧩 Step 3. Save your current PM2 process list**
   
   Once your app is running under PM2, save the list:
   ```bash
   pm2 save
   ```
   
   This saves your current processes (apps) so PM2 knows which ones to resurrect on reboot.

   **🧩 Step 4. Verify**
   
   You can check if everything's registered correctly:
   ```bash
   pm2 list
   ```
   
   Then reboot to confirm:
   ```bash
   sudo reboot
   ```
   
   After the system restarts, PM2 should auto-start and reload your app(s). You can verify once the system is back up with:
   ```bash
   pm2 status
   ```

   ### PM2 Ecosystem File (Advanced)

   Create `ecosystem.config.js` for advanced configuration:

   ```javascript
   module.exports = {
     apps: [{
       name: 'collabrio-socket-server',
       script: 'server.js',
       instances: 1,
       exec_mode: 'fork',
       watch: true,
       ignore_watch: [
         'node_modules',
         'messages/processed',
         'server.log',
         '*.log'
       ],
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true,
       max_restarts: 10,
       min_uptime: '10s'
     }]
   };
   ```

   Then start with: `pm2 start ecosystem.config.js`

## Troubleshooting

### PM2 Issues

**Server not starting:**
```bash
# Check PM2 logs
pm2 logs collabrio-socket-server

# Check if port is already in use
netstat -tulpn | grep :3000
```

**File watching not working:**
```bash
# Make sure messages directory exists
mkdir -p messages/processed

# Check PM2 is not restarting too frequently
pm2 monit
```

### File-Based Injection Issues

**Messages not being processed:**
1. Ensure the session ID in the filename matches an active session
2. Check `/debug/sessions` endpoint to see active sessions
3. Verify file permissions allow reading
4. Check server logs: `pm2 logs collabrio-socket-server`

**Files not moving to processed directory:**
1. Ensure `messages/processed/` directory exists
2. Check write permissions on the directory
3. Look for file system errors in logs

### Performance Monitoring

```bash
# Monitor server performance
pm2 monit

# View detailed process info
pm2 show collabrio-socket-server

# Check memory usage
pm2 list
```

## Running Behind a Reverse Proxy

When running behind Nginx or another reverse proxy, ensure WebSocket connections are properly forwarded:

For Nginx, add:

```
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```
