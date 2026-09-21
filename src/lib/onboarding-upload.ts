// Shared client/server contract for chef document uploads. Deliberately separate from
// opportunity-image.ts: these go through Vercel Blob *client* uploads, so they are not
// bound by the 4.5 MB function body cap, and they accept PDFs.

export const ONBOARDING_MAX_BYTES = 10 * 1024 * 1024;
export const ONBOARDING_MAX_LABEL = "10 MB";

// Fallback for browsers that cannot complete a client upload (Blob's API answers without
// CORS headers on some networks, so the browser drops the response). The file then goes
// through our own server, which is bound by the 4.5 MB function body cap — stay under it.
export const ONBOARDING_SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const ONBOARDING_SERVER_UPLOAD_MAX_LABEL = "4 MB";

export const ONBOARDING_ACCEPTED_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
} as const;

export type OnboardingContentType = keyof typeof ONBOARDING_ACCEPTED_TYPES;

export const ONBOARDING_ACCEPT_ATTRIBUTE = Object.keys(ONBOARDING_ACCEPTED_TYPES).join(",");

const BLOB_ROOT = "onboarding";

export function onboardingBlobPrefix(userId: string, questionId: string) {
  return `${BLOB_ROOT}/${userId}/${questionId}/`;
}

/**
 * Vercel Blob client uploads let the *client* choose the pathname —
 * `onBeforeGenerateToken` can only accept or reject it, never rewrite it. Every path
 * therefore has to be checked against the session user before a token is issued.
 */
export function isOwnedOnboardingPath(pathname: string, userId: string, questionId?: string) {
  if (pathname.includes("..") || pathname.startsWith("/")) return false;
  const prefix = questionId
    ? onboardingBlobPrefix(userId, questionId)
    : `${BLOB_ROOT}/${userId}/`;
  if (!pathname.startsWith(prefix)) return false;
  // Exactly one file segment after the prefix: no nested folders.
  const rest = pathname.slice(prefix.length);
  return rest.length > 0 && !rest.includes("/");
}

/**
 * Returns a code rather than a sentence: the chef-facing UI renders it in their own
 * language, while the API routes turn it into English for their JSON responses.
 */
export type FileRejection = "type" | "size" | "empty";

export function validateOnboardingFile(file: { type: string; size: number }): FileRejection | null {
  if (!(file.type in ONBOARDING_ACCEPTED_TYPES)) return "type";
  if (file.size > ONBOARDING_MAX_BYTES) return "size";
  if (file.size <= 0) return "empty";
  return null;
}

const FILE_REJECTION_EN: Record<FileRejection, string> = {
  type: "Only PDF, JPG, PNG, WebP or HEIC files are allowed.",
  size: `The file is too large (max ${ONBOARDING_MAX_LABEL}).`,
  empty: "The file appears to be empty.",
};

export function fileRejectionMessage(code: FileRejection) {
  return FILE_REJECTION_EN[code];
}

export function extensionFor(contentType: string) {
  return ONBOARDING_ACCEPTED_TYPES[contentType as OnboardingContentType] ?? "bin";
}

export function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
