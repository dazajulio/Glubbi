/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Converts raw 3-5MB camera photos (e.g. 3456x5184) down to ~40-80KB WebP/JPEG DataURL (max 1000px).
 */
export async function compressImage(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate aspect ratio scaling
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw resized image onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export as webp if supported, otherwise fallback to jpeg
      try {
        const compressedWebP = canvas.toDataURL('image/webp', quality);
        if (compressedWebP.startsWith('data:image/webp')) {
          resolve(compressedWebP);
          return;
        }
      } catch (e) {
        // Fallback
      }

      const compressedJpeg = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedJpeg);
    };

    reader.readAsDataURL(file);
  });
}
