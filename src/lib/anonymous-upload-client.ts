import {
  ANONYMOUS_UPLOAD_LIMIT,
  ANONYMOUS_UPLOAD_STORAGE_KEY,
} from '@/lib/constants/anonymous-upload';

type AnonymousUploadRecord = {
  date?: string;
  count?: number;
};

export function getAnonymousUploadTodayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function readRecord(): AnonymousUploadRecord {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(ANONYMOUS_UPLOAD_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AnonymousUploadRecord) : {};
  } catch {
    return {};
  }
}

function writeRecord(record: AnonymousUploadRecord) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANONYMOUS_UPLOAD_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore quota / private mode
  }
}

/** Count anonymous uploads for today in this browser. */
export function getAnonymousUploadCount(today = getAnonymousUploadTodayKey()) {
  const data = readRecord();
  return data.date === today ? data.count || 0 : 0;
}

export function isAnonymousUploadLimitReached(today = getAnonymousUploadTodayKey()) {
  return getAnonymousUploadCount(today) >= ANONYMOUS_UPLOAD_LIMIT;
}

/** Increment today's anonymous upload counter after a successful upload. */
export function recordAnonymousUpload(today = getAnonymousUploadTodayKey()) {
  const data = readRecord();
  if (data.date !== today) {
    writeRecord({ date: today, count: 1 });
    return;
  }
  writeRecord({ date: today, count: (data.count || 0) + 1 });
}
