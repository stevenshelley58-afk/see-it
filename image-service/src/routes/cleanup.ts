import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
    const { room_image_url, mask_image_url, prompt, model } = req.body;

    console.log('Processing cleanup request:', { room_image_url, mask_image_url, prompt, model });

    // Mock logic: Return the original URL with a suffix to simulate a new file
    // In a real implementation, this would process the image and upload to the 'room-cleaned' path
    const cleaned_room_image_url = room_image_url; // + "?cleaned=true"; // Keep it simple for now

    res.json({
        cleaned_room_image_url
    });
});

export default router;
