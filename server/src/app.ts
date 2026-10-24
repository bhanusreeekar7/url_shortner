import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authroutes from './routes/auth.routes.js';
import urlRouter from './routes/url.routes.js';
import redirectRouter from './routes/redirect.routes.js';
import 'dotenv/config';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.loca.lt') || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(cookieParser());

app.use('/api/auth', authroutes);
app.use('/api/urls', urlRouter);
app.use('/r', redirectRouter);

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'snipurl-api' });
});

const PORT = Number(process.env.PORT) || 5003;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SnipURL Server running on port ${PORT}`);
    console.log(`📡 Base redirect URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
});

export default app;
