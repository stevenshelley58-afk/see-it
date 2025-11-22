const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage();

async function downloadToBuffer(url) {
    console.log(`Downloading from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function uploadBufferToGCS(bucketName, key, buffer, contentType) {
    console.log(`Uploading to bucket: ${bucketName}, key: ${key}`);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(key);

    await file.save(buffer, {
        contentType: contentType,
        resumable: false
    });

    const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    console.log(`Generated signed URL: ${signedUrl}`);
    return signedUrl;
}

module.exports = {
    downloadToBuffer,
    uploadBufferToGCS
};
