import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import areaRoutes from './routes/area.routes.js';
import auditRoutes from './routes/audit.routes.js';
import questionnaireRoutes from './routes/questionnaire.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { identify, requireAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN }))
app.use(express.json());
app.use(identify);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', requireAuth, areaRoutes);
app.use('/api/audits', requireAuth, auditRoutes);
app.use('/api/questionnaires', requireAuth, questionnaireRoutes);
app.use('/api/catalog', requireAuth, catalogRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

await connectDB();
app.listen(PORT, () => 
    console.log(`Server running on port ${PORT}`)
);