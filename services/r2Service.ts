
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

/**
 * Cloudflare R2 Storage Service (S3 Compatible)
 * Production-grade implementation for Digitalsight.
 * Handles large audio files (WAV) and artwork with safety limits.
 */

const R2_CONFIG = {
    accountId: import.meta.env.VITE_R2_ACCOUNT_ID,
    bucketName: import.meta.env.VITE_R2_BUCKET_NAME,
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    publicDomain: import.meta.env.VITE_R2_PUBLIC_DOMAIN,
};

// Safety Limits
const MAX_TRACK_SIZE = 250 * 1024 * 1024; // 250MB per track
const MAX_ARTWORK_SIZE = 15 * 1024 * 1024; // 15MB for artwork

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
    },
});

export const r2Service = {
    /**
     * Uploads a file to Cloudflare R2 using Multipart Upload for large files.
     */
    async uploadFile(file: File | Blob, path: string, fileName: string, onProgress?: (progress: number) => void): Promise<string> {
        const key = `${path}/${fileName}`.replace(/\/+/g, '/');
        
        // 1. Production Safety Checks
        const isAudio = fileName.toLowerCase().endsWith('.wav');
        const limit = isAudio ? MAX_TRACK_SIZE : MAX_ARTWORK_SIZE;
        
        if (file.size > limit) {
            throw new Error(`File too large. Max allowed for ${isAudio ? 'Audio' : 'Artwork'} is ${limit / (1024 * 1024)}MB.`);
        }

        try {
            // 2. Use @aws-sdk/lib-storage for managed multipart uploads
            // This is essential for 100MB+ files to ensure reliability and progress tracking
            const parallelUploads3 = new Upload({
                client: s3Client,
                params: {
                    Bucket: R2_CONFIG.bucketName,
                    Key: key,
                    Body: file,
                    ContentType: file.type || (isAudio ? 'audio/wav' : 'image/jpeg'),
                    CacheControl: 'public, max-age=31536000, immutable',
                },
                // Optional: Configure concurrency and part size
                queueSize: 4, 
                partSize: 1024 * 1024 * 5, // 5MB parts
                leavePartsOnError: false,
            });

            parallelUploads3.on("httpUploadProgress", (progress) => {
                if (onProgress && progress.loaded && progress.total) {
                    const percentage = Math.round((progress.loaded / progress.total) * 100);
                    onProgress(percentage);
                }
            });

            await parallelUploads3.done();

            // 3. Return the public URL
            return `${R2_CONFIG.publicDomain.replace(/\/$/, '')}/${key}`;
        } catch (error) {
            console.error('[R2 Service] Upload Error:', error);
            throw new Error(`Vault Transmission Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Deletes a file or directory (prefix) from Cloudflare R2.
     */
    async deleteFile(path: string): Promise<void> {
        try {
            const listCommand = new ListObjectsV2Command({
                Bucket: R2_CONFIG.bucketName,
                Prefix: path,
            });
            const listResponse = await s3Client.send(listCommand);

            if (listResponse.Contents && listResponse.Contents.length > 0) {
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: R2_CONFIG.bucketName,
                    Delete: {
                        Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
                        Quiet: true,
                    },
                });
                await s3Client.send(deleteCommand);
            } else {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: R2_CONFIG.bucketName,
                    Key: path,
                }));
            }
        } catch (error) {
            console.error('[R2 Service] Deletion Error:', error);
        }
    }
};
