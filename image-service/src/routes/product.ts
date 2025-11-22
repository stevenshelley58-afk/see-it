import { Router } from 'express';

const router = Router();

router.post('/prepare', async (req, res) => {
    const { imageUrl, productId } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: 'Missing imageUrl' });
    }

    console.log(`Preparing product ${productId} from ${imageUrl}`);

    // Mock processing
    // In real implementation: download, remove bg, save.
    // Here we just return the same URL or a "processed" version.

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
        status: 'ready',
        preparedImageUrl: imageUrl // Mock: return original as prepared
    });
});

export default router;
