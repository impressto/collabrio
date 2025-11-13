#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the frogger sprites directory
const spritesDir = path.join(__dirname, 'client/public/assets/frogger');
const outputFile = path.join(__dirname, 'client/src/components/FroggerSprites.js');

console.log('🎨 Converting Frogger sprites to base64...');
console.log('Sprites directory:', spritesDir);
console.log('Output file:', outputFile);

// Check if sprites directory exists
if (!fs.existsSync(spritesDir)) {
  console.error('❌ Sprites directory not found:', spritesDir);
  process.exit(1);
}

// Get all PNG files
const pngFiles = fs.readdirSync(spritesDir).filter(file => file.endsWith('.png'));
console.log('Found PNG files:', pngFiles);

if (pngFiles.length === 0) {
  console.error('❌ No PNG files found in sprites directory');
  process.exit(1);
}

// Convert each PNG to base64
const sprites = {};
const spriteMetadata = {};

pngFiles.forEach(file => {
  const filePath = path.join(spritesDir, file);
  const fileName = path.parse(file).name; // Remove .png extension
  
  try {
    // Read the file and convert to base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Data}`;
    
    // Store the sprite
    sprites[fileName] = dataUri;
    
    // Get file size for metadata
    const stats = fs.statSync(filePath);
    spriteMetadata[fileName] = {
      originalSize: stats.size,
      base64Size: base64Data.length
    };
    
    console.log(`✅ Converted: ${file} (${stats.size} bytes -> ${base64Data.length} base64 chars)`);
    
  } catch (error) {
    console.error(`❌ Failed to convert ${file}:`, error.message);
  }
});

// Generate the JavaScript module content
const jsContent = `// Auto-generated Frogger sprite data - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}
// Source directory: ${spritesDir}

// Base64 encoded sprite images
export const FROGGER_SPRITES = ${JSON.stringify(sprites, null, 2)};

// Sprite metadata
export const SPRITE_METADATA = ${JSON.stringify(spriteMetadata, null, 2)};

// Default dimensions for each sprite type (adjust as needed)
export const SPRITE_DIMENSIONS = {
  'frog-idle': { width: 32, height: 32 },
  'frog-up': { width: 32, height: 32 },
  'frog-down': { width: 32, height: 32 },
  'frog-left': { width: 32, height: 32 },
  'frog-right': { width: 32, height: 32 },
  'truck-green': { width: 96, height: 32 },
  'truck-orange': { width: 96, height: 32 }
};

// Helper function to get sprite by key
export const getSprite = (spriteKey) => {
  return FROGGER_SPRITES[spriteKey] || null;
};

// Helper function to get all available sprite keys
export const getAvailableSprites = () => {
  return Object.keys(FROGGER_SPRITES);
};

console.log('🎨 Frogger sprites loaded:', getAvailableSprites());
`;

// Write the output file
try {
  fs.writeFileSync(outputFile, jsContent, 'utf8');
  console.log(`✅ Successfully generated: ${outputFile}`);
  console.log(`📊 Total sprites converted: ${Object.keys(sprites).length}`);
  console.log('🎮 Ready to import in FroggerGame.jsx!');
  
  // Show import instructions
  console.log('\n📋 Usage instructions:');
  console.log('1. Import in your FroggerGame.jsx:');
  console.log('   import { FROGGER_SPRITES, SPRITE_DIMENSIONS, getSprite } from "./FroggerSprites"');
  console.log('2. Use sprites directly as data URIs - no loading required!');
  console.log('3. Example: const frogSprite = getSprite("frog-idle")');
  
} catch (error) {
  console.error('❌ Failed to write output file:', error.message);
  process.exit(1);
}