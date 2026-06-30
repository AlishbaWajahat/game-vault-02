import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { getStorageClient, isStorageConfigured } from "../config/storage";
import { env } from "../config/env";

const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

export async function initiateMultipartUpload(storageKey: string, fileSize: number) {
  if (!isStorageConfigured()) throw new Error("Storage not configured");

  const client = getStorageClient();
  const numParts = Math.ceil(fileSize / CHUNK_SIZE);

  const { UploadId } = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
    })
  );

  // Generate presigned URLs for each part
  const presignedUrls: { partNumber: number; url: string }[] = [];
  for (let i = 1; i <= numParts; i++) {
    const url = await getSignedUrl(
      client,
      new UploadPartCommand({
        Bucket: env.B2_BUCKET_NAME,
        Key: storageKey,
        UploadId,
        PartNumber: i,
      }),
      { expiresIn: 3600 }
    );
    presignedUrls.push({ partNumber: i, url });
  }

  return { uploadId: UploadId, presignedUrls, chunkSize: CHUNK_SIZE };
}

export async function completeMultipartUpload(
  storageKey: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
) {
  if (!isStorageConfigured()) throw new Error("Storage not configured");

  const client = getStorageClient();
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    })
  );
}

export async function abortMultipartUpload(storageKey: string, uploadId: string) {
  if (!isStorageConfigured()) return;

  const client = getStorageClient();
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
      UploadId: uploadId,
    })
  );
}

export async function generateDownloadUrl(storageKey: string): Promise<string> {
  if (!isStorageConfigured()) throw new Error("Storage not configured");

  // Use Cloudflare Worker URL if configured (free B2 egress via Bandwidth Alliance)
  if (env.CF_WORKER_URL && env.DOWNLOAD_SECRET) {
    const expires = Math.floor(Date.now() / 1000) + PRESIGNED_URL_EXPIRY;
    const payload = `${storageKey}:${expires}`;
    const hmac = crypto
      .createHmac("sha256", env.DOWNLOAD_SECRET)
      .update(payload)
      .digest("hex");
    const encodedKey = encodeURIComponent(storageKey);
    return `${env.CF_WORKER_URL}/${encodedKey}?expires=${expires}&token=${hmac}`;
  }

  // Fallback: direct B2 presigned URL
  const client = getStorageClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
    }),
    { expiresIn: PRESIGNED_URL_EXPIRY }
  );
}

const IMAGE_URL_EXPIRY = 7 * 24 * 3600; // 7 days

export async function generateImageUrl(storageKey: string): Promise<string> {
  if (!isStorageConfigured()) throw new Error("Storage not configured");

  // Use public URL if configured, otherwise generate a long-lived signed URL
  if (env.B2_PUBLIC_URL) {
    return `${env.B2_PUBLIC_URL}/${storageKey}`;
  }

  const client = getStorageClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
    }),
    { expiresIn: IMAGE_URL_EXPIRY }
  );
}

export async function deleteFile(storageKey: string) {
  if (!isStorageConfigured()) return;

  const client = getStorageClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
    })
  );
}

export async function uploadSingleFile(
  storageKey: string,
  buffer: Buffer,
  contentType: string,
) {
  if (!isStorageConfigured()) throw new Error("Storage not configured");

  const client = getStorageClient();
  await client.send(
    new PutObjectCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function getFileInfo(storageKey: string) {
  if (!isStorageConfigured()) throw new Error("Storage not configured");

  const client = getStorageClient();
  return client.send(
    new HeadObjectCommand({
      Bucket: env.B2_BUCKET_NAME,
      Key: storageKey,
    })
  );
}
