const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require('sharp');
const { downloadToBuffer, uploadBufferToGCS } = require('./storage');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callGemini(promptText, imageBuffer, maskBuffer = null) {
    let modelId = process.env.GEMINI_IMAGE_MODEL_PRIMARY;

    const makeRequest = async (currentModelId) => {
        console.log(`Calling Gemini model: ${currentModelId}`);
        const model = genAI.getGenerativeModel({ model: currentModelId });

        const parts = [
            { text: promptText },
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: imageBuffer.toString('base64')
                }
            }
        ];

        if (maskBuffer) {
            // For inpainting/cleanup, mask might need to be passed differently depending on exact API shape,
            // but standard multimodal usually accepts multiple images.
            // Assuming standard content parts structure for now.
            parts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: maskBuffer.toString('base64')
                }
            });
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: parts }]
        });

        const response = await result.response;
        // Accessing the inline data from the response
        // Note: The exact path might vary slightly based on SDK version, but this is standard for image gen.
        // If text-only model was used, this would fail, but we are using image models.
        // Typically image generation returns inlineData in candidates.

        const candidate = response.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].inlineData) {
            throw new Error("No image data in response");
        }

        return candidate.content.parts[0].inlineData.data;
    };

    try {
        return await makeRequest(modelId);
    } catch (error) {
        console.error(`Error with primary model ${modelId}:`, error);
        if (error.status === 429 || error.status >= 500) {
            console.log('Falling back to secondary model');
            modelId = process.env.GEMINI_IMAGE_MODEL_FALLBACK;
            return await makeRequest(modelId);
        }
        throw error;
    }
}

async function prepareProduct(sourceImageUrl, shopId, productId, assetId) {
    const imageBuffer = await downloadToBuffer(sourceImageUrl);
    const prompt = "Return this exact product image with background removed. Set background pixels to alpha 0. Do not modify product shape, color or texture. Output PNG.";

    const base64Data = await callGemini(prompt, imageBuffer);
    const outputBuffer = Buffer.from(base64Data, 'base64');

    const key = `${shopId}/${productId}/${assetId}_prepared.png`;
    return await uploadBufferToGCS(process.env.GCS_BUCKET_PRODUCT, key, outputBuffer, 'image/png');
}

async function cleanupRoom(roomImageUrl, maskUrl) {
    const roomBuffer = await downloadToBuffer(roomImageUrl);
    const maskBuffer = await downloadToBuffer(maskUrl);

    const prompt = "Use the mask to remove objects inside the white region. Inpaint background to match local context. Do not alter pixels outside the mask.";

    const base64Data = await callGemini(prompt, roomBuffer, maskBuffer);
    const outputBuffer = Buffer.from(base64Data, 'base64');

    // Generate a unique key for the cleaned room
    const key = `cleaned/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    return await uploadBufferToGCS(process.env.GCS_BUCKET_ROOM, key, outputBuffer, 'image/jpeg');
}

async function compositeScene(preparedProductImageUrl, roomImageUrl, placement, stylePreset) {
    const productBuffer = await downloadToBuffer(preparedProductImageUrl);
    const roomBuffer = await downloadToBuffer(roomImageUrl);

    // Step 1: Mechanical Placement with Sharp
    const roomMetadata = await sharp(roomBuffer).metadata();
    const roomWidth = roomMetadata.width;
    const roomHeight = roomMetadata.height;

    const pixelX = Math.round(roomWidth * placement.x);
    const pixelY = Math.round(roomHeight * placement.y);

    // Resize product based on scale (assuming scale is relative to room width or just a raw multiplier? 
    // Spec says "newWidth = productWidth * scale". Let's assume scale is a multiplier for the product's original size 
    // OR relative to room. Usually "scale" in these contexts is a multiplier. 
    // Let's stick to the spec: "newWidth = productWidth * scale" implies multiplier on original size.
    // Wait, usually in UI scale 1.0 means "default size". 
    // Let's check if we need to fit it to room. 
    // Spec says: "newWidth = productWidth * scale". I will follow that.

    const productMetadata = await sharp(productBuffer).metadata();
    const newWidth = Math.round(productMetadata.width * placement.scale);

    const resizedProduct = await sharp(productBuffer)
        .resize({ width: newWidth })
        .toBuffer();

    const guideImageBuffer = await sharp(roomBuffer)
        .composite([{ input: resizedProduct, top: pixelY, left: pixelX }])
        .toBuffer();

    // Step 2: AI Polish
    const prompt = `Object is already placed in the room. Do NOT move, resize or warp the object. Harmonize lighting, shadows, reflections to match room. Apply style: ${stylePreset}`;

    const base64Data = await callGemini(prompt, guideImageBuffer);
    const outputBuffer = Buffer.from(base64Data, 'base64');

    const key = `composite/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    return await uploadBufferToGCS(process.env.GCS_BUCKET_COMPOSITE, key, outputBuffer, 'image/jpeg');
}

module.exports = {
    prepareProduct,
    cleanupRoom,
    compositeScene
};
