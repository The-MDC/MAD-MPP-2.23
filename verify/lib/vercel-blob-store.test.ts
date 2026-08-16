import { afterEach, describe, expect, it } from "vitest";
import { isBlobConfigured } from "@/lib/vercel-blob-store";

afterEach(() => { delete process.env.BLOB_STORE_ID; delete process.env.BLOB_READ_WRITE_TOKEN; });
describe("Vercel Blob configuration", () => {
  it("requires a connected store identifier or server token", () => {
    expect(isBlobConfigured()).toBe(false);
    process.env.BLOB_STORE_ID = "store_test";
    expect(isBlobConfigured()).toBe(true);
  });
});
