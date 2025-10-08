<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collabrio - Real-time Collaborative Text Editor</title>
    
    <!-- Meta tags -->
    <meta property="og:title" content="Collabrio - Real-time Collaborative Text Editor">
    <meta property="og:description" content="Anonymous real-time collaborative text editing with WebRTC and file sharing capabilities">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Collabrio - Real-time Collaborative Text Editor">
    <meta name="twitter:description" content="Anonymous collaborative editing sessions with instant synchronization">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="./client/public/collaborio.png">
    <link rel="apple-touch-icon" href="./client/public/collaborio.png">
    
    <!-- Styles -->
    <link rel="stylesheet" href="./client/dist/assets/index.css" type="text/css" />
    
    <!-- Full page layout -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        
        #root {
            height: 100vh;
            width: 100vw;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <!-- Scripts -->
    <script type="module" src="./client/dist/assets/index.js"></script>
</body>
</html>