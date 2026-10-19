import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import ensureAdmin from './utils/ensureAdmin.js';
import ensureDefaultAreas from './utils/ensureDefaultAreas.js';
import ensureManagerUsers, { logManagerUsers } from './utils/ensureManagerUsers.js';
import areaRoutes from './routes/area.routes.js';
import auditRoutes from './routes/audit.routes.js';
import questionnaireRoutes from './routes/questionnaire.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import exportRoutes from './routes/export.routes.js';
import { identify, requireAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_ORIGIN
    }))
app.use(express.json({ limit: '2mb' }));
app.use(identify);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/areas', requireAuth, areaRoutes);
app.use('/api/audits', requireAuth, auditRoutes);
app.use('/api/questionnaires', requireAuth, questionnaireRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

await connectDB();
const createdAdmin = await ensureAdmin();
if (createdAdmin) console.log(`Control user "${createdAdmin}" created or restored as admin`);
const addedAreas = await ensureDefaultAreas();
if (addedAreas.length) console.log(`Default areas added: ${addedAreas.join(', ')}`);
logManagerUsers(await ensureManagerUsers());
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);
