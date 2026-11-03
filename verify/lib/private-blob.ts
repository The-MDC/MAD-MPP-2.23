/**
 * The PRIVATE Blob store: concierge upload quarantine and encrypted portrait payloads. Never served from a URL.
 *
 * The project's original store (BLOB_READ_WRITE_TOKEN) is a PUBLIC store, and a store's access cannot be changed after
 * creation, so private data uses a second store connected with the env prefix PRIVATE_BLOB
 * (PRIVATE_BLOB_READ_WRITE_TOKEN). Nothing private is ever written to the public store.
 *
 * Free tier (Hobby): 1 GB storage, 2,000 advanced operations (uploads, lists), 10,000 simple operations and 10 GB
 * transfer a month; exceeding them locks Blob for 30 days. Files are deleted right after scanning, and the daily
 * upload cap below keeps a busy month well inside the operation allowance.
 */
export const privateBlobToken = (env: Record<string, string | undefined> = process.env): string | null =>
  env.PRIVATE_BLOB_READ_WRITE_TOKEN?.trim() || null;

export const privateBlobConfigured = (env?: Record<string, string | undefined>) => privateBlobToken(env) !== null;

/**
 * Large-file uploads allowed per day. Each costs about two advanced operations (the upload, plus a share of the daily
 * sweep), so the default of 30 a day is roughly 1,800 a month, under Hobby's 2,000. Raise it on Pro.
 */
export const blobDailyUploadCap = (env: Record<string, string | undefined> = process.env): number => {
  const n = Math.floor(Number(env.BLOB_DAILY_UPLOAD_CAP));
  return Number.isFinite(n) && n >= 0 ? n : 30;
};
