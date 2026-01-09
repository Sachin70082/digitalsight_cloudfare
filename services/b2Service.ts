
const B2_KEY_ID = '718396a1f5d2';
const B2_APP_KEY = '00324283e699f38049c198b56c32055ee2edc70929';
const B2_BUCKET_NAME = 'Digitalsight';

interface B2AuthResponse {
    accountId: string;
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
    recommendedPartSize: number;
}

interface B2UploadUrlResponse {
    bucketId: string;
    uploadUrl: string;
    authorizationToken: string;
}

let cachedAuth: B2AuthResponse | null = null;
let cachedBucketId: string | null = null;

export const b2Service = {
    async authorize(): Promise<B2AuthResponse> {
        if (cachedAuth) return cachedAuth;

        const credentials = btoa(`${B2_KEY_ID}:${B2_APP_KEY}`);
        const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
            headers: { 'Authorization': `Basic ${credentials}` }
        });

        if (!response.ok) throw new Error('B2 Authorization failed');
        cachedAuth = await response.json();
        return cachedAuth!;
    },

    async getBucketId(): Promise<string> {
        if (cachedBucketId) return cachedBucketId;
        const auth = await this.authorize();
        
        const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
            method: 'POST',
            headers: { 'Authorization': auth.authorizationToken },
            body: JSON.stringify({ accountId: auth.accountId })
        });

        const data = await response.json();
        const bucket = data.buckets.find((b: any) => b.bucketName === B2_BUCKET_NAME);
        if (!bucket) throw new Error(`Bucket ${B2_BUCKET_NAME} not found`);
        cachedBucketId = bucket.bucketId;
        return cachedBucketId!;
    },

    async uploadFile(file: File | Blob, fileName: string, path: string): Promise<string> {
        const auth = await this.authorize();
        const bucketId = await this.getBucketId();

        // Get upload URL
        const urlResponse = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: { 'Authorization': auth.authorizationToken },
            body: JSON.stringify({ bucketId })
        });
        const uploadInfo: B2UploadUrlResponse = await urlResponse.json();

        // Upload
        const fileData = file instanceof File ? await file.arrayBuffer() : await file.arrayBuffer();
        const sha1 = await this.calculateSha1(fileData);

        const uploadResponse = await fetch(uploadInfo.uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': uploadInfo.authorizationToken,
                'X-Bz-File-Name': encodeURIComponent(`${path}/${fileName}`),
                'Content-Type': file.type || 'application/octet-stream',
                'X-Bz-Content-Sha1': sha1,
            },
            body: fileData
        });

        if (!uploadResponse.ok) {
            const err = await uploadResponse.json();
            throw new Error(`Upload failed: ${err.message}`);
        }

        const result = await uploadResponse.json();
        // Return public download URL
        return `${auth.downloadUrl}/file/${B2_BUCKET_NAME}/${path}/${fileName}`;
    },

    async saveState(data: any): Promise<void> {
        const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        await this.uploadFile(jsonBlob, 'system_state.json', 'data');
    },

    async loadState(): Promise<any | null> {
        try {
            const auth = await this.authorize();
            const response = await fetch(`${auth.downloadUrl}/file/${B2_BUCKET_NAME}/data/system_state.json`);
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.warn('Could not load remote state, starting fresh.');
            return null;
        }
    },

    async calculateSha1(data: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
};
