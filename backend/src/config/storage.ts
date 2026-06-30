import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

let s3Client: S3Client | null = null;

export function getStorageClient(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.B2_REGION,
      endpoint: `https://s3.${env.B2_REGION}.backblazeb2.com`,
      credentials: {
        accessKeyId: env.B2_KEY_ID,
        secretAccessKey: env.B2_APPLICATION_KEY,
      },
    });
  }
  return s3Client;
}

export function isStorageConfigured(): boolean {
  return !!(env.B2_KEY_ID && env.B2_APPLICATION_KEY && env.B2_BUCKET_NAME);
}
