<?php
    // Read version from package.json for cache busting
    $packageJson = file_get_contents(__DIR__ . '/package.json');
    $packageData = json_decode($packageJson, true);
    $version     = $packageData['version'] ?? '1.0.0';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collabrio - Real-time Collaborative Clipboard</title>

    <!-- Meta tags -->
    <meta name="description" content="Anonymous real-time collaborative clipboard editing with WebRTC and file sharing capabilities">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://impressto.ca/collabrio/">
    <meta property="og:title" content="Collabrio - Real-time Collaborative Clipboard">
    <meta property="og:description" content="Anonymous real-time collaborative clipboard editing with WebRTC and file sharing capabilities">
    <meta property="og:image" content="https://impressto.ca/collabrio/client/public/collabrio-full.jpg">
    <meta property="og:image:width" content="1080">
    <meta property="og:image:height" content="1080">
    <meta property="og:image:alt" content="Collabrio - Real-time Collaborative Clipboard">
    <meta property="og:site_name" content="Collabrio">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://impressto.ca/collabrio/">
    <meta property="twitter:title" content="Collabrio - Real-time Collaborative Text Editor">
    <meta property="twitter:description" content="Anonymous real-time collaborative text editing with WebRTC and file sharing capabilities">
    <meta property="twitter:image" content="https://impressto.ca/collabrio/client/public/collabrio-full.jpg">


    <!-- Favicon -->
    <link rel="icon" type="image/png" href="./client/public/collaborio.png">
    <link rel="apple-touch-icon" href="./client/public/collaborio.png">

    <!-- Styles -->
    <link rel="stylesheet" href="./client/dist/assets/index.css?v=<?php echo $version; ?>" type="text/css" />

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
    <script type="module" src="./client/dist/assets/index.js?v=<?php echo $version; ?>"></script>

    <?php
        // Include Google Analytics tracking if available
        if (file_exists(__DIR__ . '/gtag_include.php')) {
            include __DIR__ . '/gtag_include.php';
        }
    ?>



</body>
</html>
