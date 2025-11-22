import { Router } from 'express';

const router = Router();

router.post('/composite', async (req, res) => {
    const { roomImageUrl, productImageUrl, placement } = req.body;

    if (!roomImageUrl || !productImageUrl) {
        return res.status(400).json({ error: 'Missing images' });
    }

    console.log('Generating composite', { roomImageUrl, productImageUrl, placement });

    // Mock generation
    // In real implementation: Call Gemini or other service.

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return a placeholder image or the room image for now
    res.json({
        status: 'completed',
        imageUrl: roomImageUrl // Mock: return room image as result
    });
});

export default router;
