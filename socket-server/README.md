# Collabrio WebRTC Socket Server

This is a Node.js WebSocket server that handles WebRTC signaling for the Collabrio text sharing application. It replaces the PHP-based signaling endpoints with a more efficient real-time communication system using Socket.IO.

## Features

- **Real-time Collaboration**: WebSocket-based document synchronization
- **Session Ma3. Check server logs: `pm2 logs collabrio-socket-server`agement**: Anonymous sessions with URL hash-based access
- **Client Presence Tracking**: Live user count and connection status
- **Text Injection**: REST API and file-based message injection
- **File Watching**: Automated message processing from file system
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

2. Configure environment variables (optional):
   - Create a `.env` file in this directory with:
   ```
   PORT=3000
   ```
   - You can change the port as needed.

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

## WebSocket Events

### Client to Server

- `join-session` - Join a session with sessionId and clientId
- `document-change` - Send document updates to other clients in session
- `leave-session` - Leave the current session
- `signal` - Send a WebRTC signaling message to another client (future feature)

### Server to Client

- `document-update` - Receive document changes from other clients
- `user-joined` - Notification when a user joins the session
- `user-left` - Notification when a user leaves the session
- `server-text-injection` - Receive injected messages from server/automation
- `signal` - Receive WebRTC signaling messages (future feature)

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
