import { afterEach, describe, expect, it } from "vitest";
import { isBlobConfigured } from "@/lib/vercel-blob-store";
import { blobDailyUploadCap } from "@/lib/private-blob";

afterEach(() => { delete process.env.PRIVATE_BLOB_READ_WRITE_TOKEN; delete process.env.BLOB_READ_WRITE_TOKEN; });
describe("Vercel Blob configuration", () => {
  it("requires the PRIVATE store's token; the project's public store never counts", () => {
    expect(isBlobConfigured()).toBe(false);
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_public";
    expect(isBlobConfigured()).toBe(false);
    process.env.PRIVATE_BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_private";
    expect(isBlobConfigured()).toBe(true);
  });
  it("keeps large uploads inside the Hobby operation allowance by default", () => {
    expect(blobDailyUploadCap({})).toBe(30);
    expect(30 * 2 * 30).toBeLessThan(2000);
    expect(blobDailyUploadCap({ BLOB_DAILY_UPLOAD_CAP: "200" })).toBe(200);
  });
});
