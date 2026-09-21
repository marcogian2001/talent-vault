export const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // Vercel Functions cap request bodies at 4.5 MB
export const IMAGE_MAX_LABEL = "4 MB";

export const IMAGE_ACCEPTED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const LEGACY_PATH_PREFIX = "/photos/";

export function isBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

// Images are either static files shipped in public/photos or uploads in Vercel Blob.
export function isAllowedImagePath(value: string) {
  return value.startsWith(LEGACY_PATH_PREFIX) || isBlobUrl(value);
}

export function validateImageFile(file: { type: string; size: number }) {
  if (!(file.type in IMAGE_ACCEPTED_TYPES)) {
    return "Only JPG, PNG or WebP images are allowed.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `The image is too large (max ${IMAGE_MAX_LABEL}).`;
  }
  return null;
}
