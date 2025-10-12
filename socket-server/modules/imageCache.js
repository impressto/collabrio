const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// Configuration for cached images
const CACHED_IMAGE_CONFIG = {
  maxImagesPerSession: 5,
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};

class ImageCache {
  constructor(database) {
    this.db = database;
    this.CACHED_IMAGES_DIR = path.join(__dirname, '..', 'cached-images');
    this.initialize();
  }

  initialize() {
    // Create cached images directory
    if (!fs.existsSync(this.CACHED_IMAGES_DIR)) {
      fs.mkdirSync(this.CACHED_IMAGES_DIR, { recursive: true });
      console.log('Created cached-images directory');
    }
  }

  // Helper function to check if file is an image
  isImageFile(mimeType) {
    return CACHED_IMAGE_CONFIG.allowedImageTypes.includes(mimeType.toLowerCase());
  }

  // Helper function to get session's cached images directory
  getSessionCacheDir(sessionId) {
    const sessionDir = path.join(this.CACHED_IMAGES_DIR, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    return sessionDir;
  }

  // Main function to cache an image for a session
  async cacheImageForSession(sessionId, fileData, uploaderUsername) {
    try {
      console.log(`cacheImageForSession called: sessionId=${sessionId}, fileId=${fileData.id}, mimeType=${fileData.mimeType}`);
      
      if (!this.isImageFile(fileData.mimeType)) {
        console.log(`File ${fileData.filename} not cached - not an image (MIME: ${fileData.mimeType})`);
        return; // Only cache images
      }

      console.log(`Creating session directory for caching...`);
      const sessionDir = this.getSessionCacheDir(sessionId);
      const filename = `${fileData.id}_${fileData.filename}`;
      const filePath = path.join(sessionDir, filename);

      console.log(`Writing file to disk: ${filePath}`);
      // Write file to disk
      await fsPromises.writeFile(filePath, fileData.buffer);

      console.log(`Storing image metadata in database...`);
      // Store in database
      await this.db.insertCachedImage(
        sessionId, fileData.id, fileData.filename, fileData.mimeType, 
        fileData.size, fileData.uploadedBy, uploaderUsername, 
        fileData.uploadTimestamp, filePath
      );

      console.log(`Running cleanup for old cached images...`);
      // Keep only the last 5 images for this session
      await this.cleanupOldCachedImages(sessionId);

      console.log(`Cached image: ${fileData.filename} for session ${sessionId}`);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  // Helper function to cleanup old cached images (keep only last 5)
  async cleanupOldCachedImages(sessionId) {
    try {
      const images = await this.db.getAllCachedImagesForSession(sessionId);

      // If we have more than the maximum, delete the oldest ones
      if (images.length > CACHED_IMAGE_CONFIG.maxImagesPerSession) {
        const imagesToDelete = images.slice(CACHED_IMAGE_CONFIG.maxImagesPerSession);
        
        for (const image of imagesToDelete) {
          // Delete from filesystem
          try {
            await fsPromises.unlink(image.file_path);
          } catch (err) {
            console.warn(`Could not delete cached image file: ${image.file_path}`, err.message);
          }

          // Delete from database
          await this.db.deleteCachedImage(image.id);
        }

        console.log(`Cleaned up ${imagesToDelete.length} old cached images for session ${sessionId}`);
      }
    } catch (error) {
      console.error('Error cleaning up cached images:', error);
    }
  }

  // Helper function to get cached images for a session
  async getCachedImagesForSession(sessionId) {
    try {
      return await this.db.getCachedImages(sessionId, CACHED_IMAGE_CONFIG.maxImagesPerSession);
    } catch (error) {
      console.error('Error getting cached images:', error);
      return [];
    }
  }

  // Helper function to send cached images to a client
  async sendCachedImagesToClient(sessionId, socket) {
    try {
      const cachedImages = await this.getCachedImagesForSession(sessionId);
      
      if (cachedImages.length > 0) {
        console.log(`Sending ${cachedImages.length} cached images to client in session ${sessionId}`);
        
        // Send each cached image as a file-available event
        for (const image of cachedImages) {
          socket.emit('file-available', {
            fileId: image.file_id,
            filename: image.filename,
            size: image.file_size,
            mimeType: image.mime_type,
            uploadedBy: image.uploaded_by,
            uploaderUsername: image.uploader_username,
            timestamp: image.upload_timestamp,
            isCached: true, // Flag to indicate this is a cached image
            cachedImageUrl: `/cached-image/${sessionId}/${image.file_id}`
          });
        }
      }
    } catch (error) {
      console.error('Error sending cached images to client:', error);
    }
  }

  // Serve cached image file
  async serveCachedImage(sessionId, fileId) {
    try {
      const imageInfo = await this.db.getCachedImageInfo(sessionId, fileId);

      if (!imageInfo) {
        return { error: 'Cached image not found', status: 404 };
      }

      // Check if file exists on disk
      if (!fs.existsSync(imageInfo.file_path)) {
        console.warn(`Cached image file missing: ${imageInfo.file_path}`);
        return { error: 'Cached image file not found on disk', status: 404 };
      }

      // Read and return the file
      const fileBuffer = await fsPromises.readFile(imageInfo.file_path);
      
      console.log(`Served cached image: ${imageInfo.filename} for session ${sessionId}`);

      return {
        buffer: fileBuffer,
        mimeType: imageInfo.mime_type,
        fileSize: imageInfo.file_size,
        filename: imageInfo.filename
      };
    } catch (error) {
      console.error('Cached image serving error:', error);
      return { error: 'Error serving cached image', status: 500 };
    }
  }

  // Delete a specific cached image
  async deleteCachedImage(sessionId, fileId) {
    try {
      // Get the image info first to find the file path
      const imageInfo = await this.db.getCachedImageInfo(sessionId, fileId);
      
      if (!imageInfo) {
        return { error: 'Cached image not found', status: 404 };
      }

      // Delete from filesystem
      try {
        if (fs.existsSync(imageInfo.file_path)) {
          await fsPromises.unlink(imageInfo.file_path);
          console.log(`Deleted cached image file: ${imageInfo.file_path}`);
        }
      } catch (err) {
        console.warn(`Could not delete cached image file: ${imageInfo.file_path}`, err.message);
        // Continue to delete from database even if file deletion fails
      }

      // Delete from database (find by session_id and file_id)
      await this.db.deleteCachedImageBySessionAndFileId(sessionId, fileId);

      console.log(`Successfully deleted cached image: ${imageInfo.filename} from session ${sessionId}`);
      
      return { success: true, filename: imageInfo.filename };
    } catch (error) {
      console.error('Error deleting cached image:', error);
      return { error: 'Error deleting cached image', status: 500 };
    }
  }

  // Clean up cached images for inactive sessions
  async cleanupInactiveCachedImages() {
    try {
      const inactiveThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const oldImages = await this.db.getInactiveCachedImages(inactiveThreshold);

      console.log(`Found ${oldImages.length} cached images from inactive sessions to clean up`);

      for (const image of oldImages) {
        // Delete file from filesystem
        try {
          await fsPromises.unlink(image.file_path);
        } catch (err) {
          console.warn(`Could not delete cached image file: ${image.file_path}`, err.message);
        }

        // Delete from database
        await this.db.deleteCachedImage(image.id);
      }

      // Also clean up empty session directories
      try {
        const sessionDirs = await fsPromises.readdir(this.CACHED_IMAGES_DIR);
        for (const sessionDir of sessionDirs) {
          const sessionPath = path.join(this.CACHED_IMAGES_DIR, sessionDir);
          const stat = await fsPromises.stat(sessionPath);
          if (stat.isDirectory()) {
            const files = await fsPromises.readdir(sessionPath);
            if (files.length === 0) {
              await fsPromises.rmdir(sessionPath);
              console.log(`Removed empty session directory: ${sessionPath}`);
            }
          }
        }
      } catch (err) {
        console.warn('Error cleaning up empty session directories:', err.message);
      }

      console.log(`Cleaned up ${oldImages.length} cached images from inactive sessions`);
    } catch (error) {
      console.error('Error cleaning up inactive cached images:', error);
    }
  }
}

module.exports = ImageCache;