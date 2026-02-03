/**
 * LYT Communications - Photo Upload Service
 * Version: 1.0.0
 * Created: 2026-02-03
 * 
 * Handles photo uploads to Google Drive via Gateway API.
 * Converts files to base64, sends to Gateway which creates files in Drive.
 * Falls back to localStorage cache when offline.
 */

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const DOCUMENTS_FOLDER = '11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC';

// Helper: follow GAS redirects
async function gatewayPost(action, params) {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: GATEWAY_SECRET, action, params }),
    });
    const text = await response.text();
    if (text.includes('<HTML>') || text.includes('HREF=')) {
      const match = text.match(/HREF="([^"]+)"/i);
      if (match) {
        const redirectUrl = match[1].replace(/&amp;/g, '&');
        const redirectResponse = await fetch(redirectUrl, { mode: 'cors' });
        return await redirectResponse.json();
      }
    }
    try { return JSON.parse(text); } catch { return { result: text }; }
  } catch (err) {
    console.error('[photoService] Gateway error:', err);
    return null;
  }
}

/**
 * Convert a File object to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a single photo to Google Drive
 * @param {File} file - The file to upload
 * @param {string} projectId - Project ID for folder organization
 * @param {string} segmentId - Segment/splice ID
 * @param {string} photoType - Type label (e.g., "basket", "splice_tray_1")
 * @returns {object} { success, fileId, url, name }
 */
export async function uploadPhoto(file, projectId, segmentId, photoType) {
  try {
    const base64Data = await fileToBase64(file);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${segmentId}_${photoType}_${timestamp}.${file.name.split('.').pop() || 'jpg'}`;

    // Use Gateway driveUpload action
    const result = await gatewayPost('driveUpload', {
      folderId: DOCUMENTS_FOLDER,
      fileName,
      mimeType: file.type || 'image/jpeg',
      base64Data,
      subfolder: `projects/${projectId}/photos/${segmentId}`,
    });

    if (result && result.fileId) {
      return {
        success: true,
        fileId: result.fileId,
        url: `https://drive.google.com/file/d/${result.fileId}/view`,
        name: fileName,
      };
    }

    // If driveUpload not available, try creating via sheetsAppend to log the upload
    console.warn('[photoService] driveUpload not available, caching locally');
    return cachePhotoLocally(file, projectId, segmentId, photoType, base64Data);
  } catch (err) {
    console.error('[photoService] Upload failed:', err);
    return cachePhotoLocally(file, projectId, segmentId, photoType);
  }
}

/**
 * Upload multiple photos for a workflow step
 * @param {Array<{file: File, type: string}>} photos - Array of photo objects
 * @param {string} projectId - Project ID
 * @param {string} segmentId - Segment/splice ID
 * @param {function} onProgress - Progress callback (index, total)
 * @returns {Array<object>} Results array
 */
export async function uploadPhotoBatch(photos, projectId, segmentId, onProgress) {
  const results = [];
  for (let i = 0; i < photos.length; i++) {
    if (onProgress) onProgress(i + 1, photos.length);
    const result = await uploadPhoto(photos[i].file, projectId, segmentId, photos[i].type || `photo_${i + 1}`);
    results.push(result);
  }
  return results;
}

/**
 * Cache photo locally when offline
 */
function cachePhotoLocally(file, projectId, segmentId, photoType, base64Data) {
  try {
    const key = `photo_cache_${segmentId}_${photoType}_${Date.now()}`;
    const cacheEntry = {
      name: file.name,
      type: file.type,
      size: file.size,
      projectId,
      segmentId,
      photoType,
      timestamp: new Date().toISOString(),
      // Only store base64 if available and not too large (< 2MB)
      data: base64Data && base64Data.length < 2 * 1024 * 1024 ? base64Data : null,
      synced: false,
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    console.log(`[photoService] Cached locally: ${key}`);
    return {
      success: true,
      cached: true,
      name: file.name,
      url: null,
      localKey: key,
    };
  } catch (err) {
    console.error('[photoService] Cache failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get pending (unsynced) photos from local cache
 */
export function getPendingPhotos() {
  const pending = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('photo_cache_')) {
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (!entry.synced) {
          pending.push({ key, ...entry });
        }
      } catch {
        // skip corrupt entries
      }
    }
  }
  return pending;
}

/**
 * Sync pending cached photos when back online
 */
export async function syncPendingPhotos(onProgress) {
  const pending = getPendingPhotos();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    if (onProgress) onProgress(i + 1, pending.length);

    if (entry.data) {
      const result = await gatewayPost('driveUpload', {
        folderId: DOCUMENTS_FOLDER,
        fileName: `${entry.segmentId}_${entry.photoType}_${entry.timestamp.replace(/[:.]/g, '-')}.jpg`,
        mimeType: entry.type || 'image/jpeg',
        base64Data: entry.data,
        subfolder: `projects/${entry.projectId}/photos/${entry.segmentId}`,
      });

      if (result && result.fileId) {
        entry.synced = true;
        entry.fileId = result.fileId;
        localStorage.setItem(entry.key, JSON.stringify(entry));
        synced++;
      } else {
        failed++;
      }
    } else {
      failed++; // No base64 data cached, can't sync
    }
  }

  return { synced, failed, total: pending.length };
}

const photoService = {
  uploadPhoto,
  uploadPhotoBatch,
  getPendingPhotos,
  syncPendingPhotos,
};
export default photoService;
