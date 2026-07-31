export function getImageExtensionAndType(file: File | Blob): { ext: string; type: string } {
  const name = "name" in file ? (file.name || "") : "";
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : "";
  let type = (file.type || "").toLowerCase();

  if (!type && ext) {
    if (ext === ".jpg" || ext === ".jpeg") type = "image/jpeg";
    else if (ext === ".png") type = "image/png";
    else if (ext === ".webp") type = "image/webp";
    else if (ext === ".gif") type = "image/gif";
  }

  return { ext, type };
}

const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

export function isImageFile(file: File | Blob): boolean {
  const { type, ext } = getImageExtensionAndType(file);
  if (ALLOWED_IMAGE_MIME_TYPES.includes(type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) return true;
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) return true;
  return false;
}

export async function compressImage({ file, maxWidth, maxHeight, crop = false }: {
  file: File | Blob,
  maxWidth?: number,
  maxHeight?: number,
  crop?: boolean
}): Promise<File | Blob> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error("File is not a supported image."));
      return;
    }
    const { ext, type } = getImageExtensionAndType(file);
    const reader = new FileReader();
    reader.readAsDataURL(file as Blob);

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onerror = () => reject(new Error("Failed to decode image."));
      img.onload = () => {
        const { width, height } = img;
        const maxW = typeof maxWidth === "number" && maxWidth > 0 ? maxWidth : undefined;
        const maxH = typeof maxHeight === "number" && maxHeight > 0 ? maxHeight : undefined;
        const overBounds = (maxW ? width > maxW : false) || (maxH ? height > maxH : false);
        if (!maxW && !maxH) {
          resolve(file);
          return;
        }
        if (!overBounds) {
          resolve(file);
          return;
        }

        let sx = 0;
        let sy = 0;
        let sw = width;
        let sh = height;
        let targetWidth = width;
        let targetHeight = height;

        if (crop && maxW && maxH) {
          const coverScale = Math.max(maxW / width, maxH / height);
          const scaledWidth = Math.round(width * coverScale);
          const scaledHeight = Math.round(height * coverScale);
          const offsetX = Math.max(0, Math.round((scaledWidth - maxW) / 2));
          const offsetY = Math.max(0, Math.round((scaledHeight - maxH) / 2));

          targetWidth = maxW;
          targetHeight = maxH;
          sw = Math.round((maxW / scaledWidth) * width);
          sh = Math.round((maxH / scaledHeight) * height);
          sx = Math.round((offsetX / scaledWidth) * width);
          sy = Math.round((offsetY / scaledHeight) * height);
        } else {
          const fitScale = Math.min(
            maxW ? maxW / width : 1,
            maxH ? maxH / height : 1,
            1,
          );
          targetWidth = Math.round(width * fitScale);
          targetHeight = Math.round(height * fitScale);
        }

        if (targetWidth === width && targetHeight === height && sx === 0 && sy === 0 && sw === width && sh === height) {
          resolve(file);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
          const outputType = type || ("type" in file ? (file.type || "") : "");
          canvas.toBlob((blob) => {
            if (blob) {
              const fileName = "name" in file && file.name
                ? file.name
                : `optimized-image${ext || ""}`;
              const optimizedFile = new File(
                [blob],
                fileName,
                { type: outputType, lastModified: Date.now() },
              );
              resolve(optimizedFile);
            } else {
              reject(new Error("Canvas to Blob failed"));
            }
          }, outputType || undefined, 0.85);
        } else {
          reject(new Error("No canvas context"));
        }
      };
    };
  });
}
