
export const ACR_CLOUD_CONFIG = {
    host: import.meta.env.VITE_ACR_HOST || 'identify-ap-southeast-1.acrcloud.com',
    accessKey: import.meta.env.VITE_ACR_ACCESS_KEY || '89131dd60c3b7e23a43acef3f7b481ee',
    accessSecret: import.meta.env.VITE_ACR_SECRET_KEY || 'cNI9JzUnbJTmgw7zwNzRRCFCJ9DH2aJ7acnihtva',
    region: 'ap-southeast-1'
};

async function generateSignature(data: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(data);
    
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );
    
    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * ACR Cloud Recognition Service
 */
export const acrCloudService = {
    async identifyTrack(audioUrl: string, startTime: number = 0, duration: number = 15) {
        console.log(`Identifying track at ${audioUrl} (Start: ${startTime}s, Duration: ${duration}s) using ACR Cloud...`);
        
        try {
            // 1. Fetch Header (0-127 bytes as requested)
            const headerResponse = await fetch(audioUrl, {
                headers: { 'Range': 'bytes=0-127' }
            });
            
            if (!headerResponse.ok && headerResponse.status !== 206) {
                throw new Error(`Failed to fetch header: ${headerResponse.statusText}`);
            }
            
            const headerBuffer = await headerResponse.arrayBuffer();
            const headerView = new DataView(headerBuffer);
            
            // Default bitrate for 44.1kHz, 16-bit, Stereo
            let bytesPerSec = 176400; 
            
            // Try to detect actual sample rate from header
            if (headerView.getUint32(0, true) === 0x46464952) { // "RIFF"
                const sampleRate = headerView.getUint32(24, true);
                const numChannels = headerView.getUint16(22, true);
                const bitsPerSample = headerView.getUint16(34, true);
                if (sampleRate > 0 && numChannels > 0 && bitsPerSample > 0) {
                    bytesPerSec = (sampleRate * numChannels * bitsPerSample) / 8;
                    console.log(`Detected WAV: ${sampleRate}Hz, ${numChannels}ch, ${bitsPerSample}bit. Bytes/sec: ${bytesPerSec}`);
                }
            }

            // 2. Calculate and fetch audio section
            const startByte = Math.floor(startTime * bytesPerSec) + 128;
            const endByte = startByte + Math.floor(duration * bytesPerSec);
            
            const dataResponse = await fetch(audioUrl, {
                headers: {
                    'Range': `bytes=${startByte}-${endByte - 1}`
                }
            });
            
            if (!dataResponse.ok && dataResponse.status !== 206) {
                throw new Error(`Failed to fetch audio data: ${dataResponse.statusText}`);
            }
            
            const dataBuffer = await dataResponse.arrayBuffer();
            
            // 3. Combine Header + Data Chunk
            const combinedBuffer = new Uint8Array(headerBuffer.byteLength + dataBuffer.byteLength);
            combinedBuffer.set(new Uint8Array(headerBuffer), 0);
            combinedBuffer.set(new Uint8Array(dataBuffer), headerBuffer.byteLength);
            
            // 4. Patch WAV header sizes
            const view = new DataView(combinedBuffer.buffer);
            if (view.getUint32(0, true) === 0x46464952) { // "RIFF"
                // Patch ChunkSize (Offset 4)
                view.setUint32(4, combinedBuffer.byteLength - 8, true);
                
                // Find "data" chunk to patch Subchunk2Size
                // We search for "data" (0x61746164) in the header area
                let dataChunkOffset = -1;
                for (let i = 12; i < headerBuffer.byteLength - 8; i++) {
                    if (view.getUint32(i, true) === 0x61746164) {
                        dataChunkOffset = i;
                        break;
                    }
                }
                
                if (dataChunkOffset !== -1) {
                    view.setUint32(dataChunkOffset + 4, combinedBuffer.byteLength - (dataChunkOffset + 8), true);
                    console.log(`Patched WAV header at offset ${dataChunkOffset}. Total size: ${combinedBuffer.byteLength}`);
                }
            }

            const finalBlob = new Blob([combinedBuffer.buffer], { type: 'audio/wav' });
            const timestamp = Math.floor(Date.now() / 1000).toString();
            
            // 5. Prepare signature
            const method = 'POST';
            const endpoint = '/v1/identify';
            const signatureVersion = '1';
            const dataType = 'audio';
            
            const stringToSign = [
                method,
                endpoint,
                ACR_CLOUD_CONFIG.accessKey,
                dataType,
                signatureVersion,
                timestamp
            ].join('\n');
            
            const signature = await generateSignature(stringToSign, ACR_CLOUD_CONFIG.accessSecret);
            
            // 6. Prepare Form Data
            const formData = new FormData();
            formData.append('sample', finalBlob);
            formData.append('access_key', ACR_CLOUD_CONFIG.accessKey);
            formData.append('data_type', dataType);
            formData.append('signature_version', signatureVersion);
            formData.append('signature', signature);
            formData.append('sample_bytes', finalBlob.size.toString());
            formData.append('timestamp', timestamp);
            
            // 7. Call ACR Cloud API
            const response = await fetch(`https://${ACR_CLOUD_CONFIG.host}${endpoint}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`ACR Cloud API error: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('ACR Cloud identification failed:', error);
            throw error;
        }
    }
};
