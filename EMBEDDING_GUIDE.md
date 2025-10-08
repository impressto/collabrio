# Embedding Collabrio in External Websites

Collabrio is designed to be safely embedded in external websites without CSS conflicts. The application uses comprehensive CSS isolation to prevent styling conflicts with host pages.

## Embedding Methods

### Method 1: Direct HTML Embed (Recommended)

After building the application, you can embed it using an iframe or directly include the built files:

```html
<!-- Option 1: Iframe Embed (Safest) -->
<iframe 
  src="https://your-domain.com/collabrio/" 
  width="100%" 
  height="600px"
  frameborder="0"
  title="Collabrio Collaborative Editor"
></iframe>

<!-- Option 2: Direct Embed -->
<div id="collabrio-embed"></div>
<script type="module">
  import('/path/to/collabrio/assets/index.js');
</script>
```

### Method 2: Custom Container

If you need more integration with your page:

```html
<div class="your-page-container">
  <h2>Your Page Content</h2>
  
  <!-- Collabrio will be isolated within this container -->
  <div id="collabrio-mount-point">
    <!-- Collabrio app will be mounted here -->
  </div>
  
  <p>More of your page content</p>
</div>
```

## CSS Isolation Features

### Automatic Isolation

Collabrio uses several techniques to prevent CSS conflicts:

1. **Scoped CSS**: All styles are prefixed with `.collabrio-app`
2. **CSS Reset**: Uses `all: initial` to reset inherited styles
3. **Important Declarations**: Critical styles use `!important` to override host styles
4. **Box Model Reset**: Ensures consistent box-sizing behavior
5. **Z-index Isolation**: Uses `z-index: 1000` for proper layering

### Safe Embedding Characteristics

- ✅ **No Global CSS**: All styles are scoped under `.collabrio-app`
- ✅ **Reset Inheritance**: Prevents inheriting host page styles
- ✅ **Contained Layout**: Won't break host page layout
- ✅ **Isolated Events**: Event handling is contained within the app
- ✅ **Predictable Sizing**: Responsive within its container

## Host Page Requirements

### Minimum Requirements

Your host page should provide:

```css
.collabrio-embed-container {
  width: 100%;
  min-height: 600px; /* Minimum recommended height */
  position: relative;
}
```

### Recommended Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Website with Collabrio</title>
    <style>
        .collabrio-embed-container {
            width: 100%;
            min-height: 600px;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            margin: 2rem 0;
        }
    </style>
</head>
<body>
    <header>Your Website Header</header>
    
    <main>
        <h1>Collaborative Editing</h1>
        <p>Use the editor below to collaborate in real-time:</p>
        
        <div class="collabrio-embed-container">
            <!-- Collabrio will be mounted here -->
            <div id="collabrio-mount"></div>
        </div>
        
        <p>Continue with your website content...</p>
    </main>
    
    <script type="module" src="/path/to/collabrio/dist/assets/index.js"></script>
</body>
</html>
```

## Configuration for Embedded Use

### Environment Variables

When building for embedded use, configure these environment variables:

```bash
# For embedded deployment
VITE_SOCKET_SERVER_URL=https://your-socket-server.com
VITE_DEBUG=false
VITE_EMBEDDED_MODE=true
```

### Build Command

```bash
# Build for embedded use
npm run build

# The dist/ folder will contain:
# - index.html (for testing)
# - assets/index.js (main application)
# - assets/index.css (isolated styles)
```

## Testing the Embed

### Local Testing

1. Build the application: `npm run build`
2. Serve the dist folder: `python -m http.server 8080` (in dist directory)
3. Create a test HTML file with the embed code
4. Test that styles don't conflict

### Integration Testing

Test on pages with various CSS frameworks:

- ✅ Bootstrap
- ✅ Tailwind CSS  
- ✅ Material-UI
- ✅ Foundation
- ✅ Custom CSS frameworks

## Troubleshooting

### Common Issues

**Styles Being Overridden:**
- Ensure the `.collabrio-app` container is present
- Check that host page isn't using overly broad CSS selectors
- Verify `!important` declarations aren't being overridden

**Layout Issues:**
- Provide adequate container height (minimum 600px)
- Ensure container has `position: relative`
- Check for conflicting flex/grid layouts

**Functionality Issues:**
- Verify Socket.IO server is accessible from the embedded domain
- Check CORS settings on your socket server
- Ensure WebSocket connections aren't blocked

### Host Page CSS Recommendations

```css
/* Recommended styles for embedding container */
.collabrio-embed {
  /* Provide stable container */
  position: relative;
  min-height: 600px;
  
  /* Prevent layout shifts */
  contain: layout style;
  
  /* Smooth integration */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  
  /* Responsive */
  width: 100%;
  max-width: 100%;
}

/* Reset potential conflicts */
.collabrio-embed * {
  box-sizing: border-box;
}
```

## Security Considerations

- Use HTTPS for production deployments
- Configure appropriate CORS headers on your socket server
- Consider Content Security Policy (CSP) headers
- Validate session IDs on the server side

## Performance Tips

- Load Collabrio asynchronously to avoid blocking page render
- Consider lazy loading if the editor is below the fold
- Monitor bundle size and optimize as needed
- Use CDN for static assets in production