import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import productRoutes from './routes/product';
import sceneRoutes from './routes/scene';
import cleanupRoutes from './routes/cleanup';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/product', productRoutes);
app.use('/scene', sceneRoutes);
app.use('/room/cleanup', cleanupRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'image-service' });
});

app.listen(port, () => {
    console.log(`Image Service running on port ${port}`);
});
