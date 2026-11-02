import { del, get, put } from "@vercel/blob";
import { privateBlobToken } from "@/lib/private-blob";
import type { ObjectStore } from "@/lib/portrait-vault";

/**
 * Private, deletable Vercel Blob storage for encrypted portrait payloads.
 *
 * Vercel deployments authenticate through the project-connected Blob store's
 * short-lived OIDC credentials. `BLOB_READ_WRITE_TOKEN` remains a fallback for
 * local or non-Vercel execution. This adapter deliberately requires a private
 * store: ciphertext must never be served from a public URL.
 */
export function isBlobConfigured(): boolean {
  // Private store only (PRIVATE_BLOB_READ_WRITE_TOKEN): the project's BLOB_READ_WRITE_TOKEN store is public.
  return privateBlobToken() !== null;
}

function assertBlobCredentials(): void {
  if (!isBlobConfigured()) {
    throw new Error("Portrait storage requires a connected private Vercel Blob store");
  }
}

export function createVercelBlobObjectStore(): ObjectStore {
  assertBlobCredentials();

  return {
    deletable: true,
    async put(key, body) {
      const blob = await put(key, body, {
        access: "private",
        token: privateBlobToken()!,
        addRandomSuffix: true,
        contentType: "application/octet-stream",
      });
      return blob.url;
    },
    async get(pointer) {
      const result = await get(pointer, { access: "private", token: privateBlobToken()! });
      if (!result) return null;
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    },
    async delete(pointer) {
      await del(pointer, { token: privateBlobToken()! });
    },
  };
}
