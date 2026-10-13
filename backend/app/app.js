import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import ensureAdmin from './utils/ensureAdmin.js';
import areaRoutes from './routes/area.routes.js';
import auditRoutes from './routes/audit.routes.js';
import questionnaireRoutes from './routes/questionnaire.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import exportRoutes from './routes/export.routes.js';
import { identify, requireAuth, requireRole } from './middleware/auth.js';
import { ROLES } from './constants/roles.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN }))
app.use(express.json());
app.use(identify);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/areas', requireAuth, areaRoutes);
app.use('/api/audits', requireAuth, auditRoutes);
app.use('/api/questionnaires', requireAuth, questionnaireRoutes);
app.use('/api/catalog', requireRole(ROLES.ADMIN), catalogRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

await connectDB();
const createdAdmin = await ensureAdmin();
if (createdAdmin) console.log(`No admin found: "${createdAdmin}" is now an admin`);
app.listen(PORT, () => 
    console.log(`Server running on port ${PORT}`)
);