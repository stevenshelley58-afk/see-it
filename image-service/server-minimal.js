console.log("Starting Image Service...");
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Healthcheck
app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
});

// Placeholder routes
app.post('/product/prepare', async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/room/cleanup', async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/scene/composite', async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Image Service listening on port ${PORT}`);
});
