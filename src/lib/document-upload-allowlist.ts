/**
 * Allowed document uploads for `/api/documents/upload`.
 * Keep in sync with R2 path categories (typo `execl` is historical bucket folder name).
 */
export const DOCUMENT_UPLOAD_ALLOWLIST = {
  "application/pdf": { ext: ".pdf", category: "pdf" as const },
  "application/msword": { ext: ".doc", category: "word" as const },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: ".docx",
    category: "word" as const,
  },
  "application/vnd.ms-powerpoint": { ext: ".ppt", category: "ppt" as const },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    ext: ".pptx",
    category: "ppt" as const,
  },
  "application/vnd.ms-excel": { ext: ".xls", category: "execl" as const },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    ext: ".xlsx",
    category: "execl" as const,
  },
} as const;

export type DocumentUploadMimeType = keyof typeof DOCUMENT_UPLOAD_ALLOWLIST;

export const DOCUMENT_UPLOAD_ACCEPT = (
  Object.keys(DOCUMENT_UPLOAD_ALLOWLIST) as DocumentUploadMimeType[]
).join(",");

export function isClientDocumentUploadCandidate(file: File): boolean {
  if (Object.prototype.hasOwnProperty.call(DOCUMENT_UPLOAD_ALLOWLIST, file.type)) {
    return true;
  }
  return /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/i.test(file.name);
}
