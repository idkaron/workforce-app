import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from '../../server/db.js';
import apiRoutes from '../../server/routes/api.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Ensure MongoDB is connected for serverless functions
// In serverless, we must be careful with connection pooling. connectDB() handles this.
connectDB();

// We need to prefix the API routes with the Netlify functions path
app.use('/.netlify/functions/api', apiRoutes);

app.get('/.netlify/functions/api', (req, res) => {
  res.send('Workforce Operations Platform API is running on Netlify Functions...');
});

export const handler = serverless(app);
