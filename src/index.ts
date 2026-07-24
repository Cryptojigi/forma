import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import serviceRoutes from './routes/services';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Global Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, try again later." }
});
app.use(globalLimiter);

// Health Check for OKX ASP Daemon / Cold Starts
app.all('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'Forma ASP' });
});

// Mount Routes
app.use('/api', serviceRoutes);

app.listen(PORT, () => {
    console.log(`[Forma] Server running on port ${PORT}`);
});
