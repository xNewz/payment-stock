/**
 * Client-side image compression using Canvas API (no external deps).
 *
 * Typical results for phone slip screenshots:
 *   3-5 MB original  →  150-400 KB output  (5-20x smaller, 5-20x faster upload)
 *
 * Skips compression if the file is already small or not an image.
 */

const SKIP_THRESHOLD = 300 * 1024; // Skip compression if file < 300KB
const DEFAULT_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.85,
  mimeType: 'image/jpeg',
};

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    };
    img.src = url;
  });
}

export async function compressImage(file, userOptions = {}) {
  // Guard: only compress images
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }
  // Guard: small files don't need compression
  if (file.size < SKIP_THRESHOLD) {
    return file;
  }

  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  try {
    const img = await loadImage(file);
    let { width, height } = img;

    // Scale down (never up)
    const scale = Math.min(options.maxWidth / width, options.maxHeight / height, 1);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // White background (in case source has transparency and we output JPEG)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        options.mimeType,
        options.quality
      );
    });

    // If compression actually made it bigger (rare, e.g. small PNG icons), keep original
    if (blob.size >= file.size) {
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: options.mimeType, lastModified: Date.now() });
  } catch (err) {
    console.warn('Image compression failed, sending original:', err);
    return file;
  }
}
