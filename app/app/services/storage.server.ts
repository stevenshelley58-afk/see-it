export class StorageService {
    static async getPresignedUploadUrl(shopId: string, roomSessionId: string, filename: string) {
        // Stub: In real impl, this calls S3/GCS
        const bucket = "stub-bucket";
        const key = `room-original/${shopId}/${roomSessionId}/${filename}`;
        // Mocking a signed URL
        const uploadUrl = `https://${bucket}.s3.amazonaws.com/${key}?signature=stub`;
        const publicUrl = `https://${bucket}.s3.amazonaws.com/${key}`;

        return { uploadUrl, publicUrl };
    }
}
