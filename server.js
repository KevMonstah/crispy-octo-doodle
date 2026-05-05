import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ideaRouter from './routes/ideaRoutes.js';
import authRouter from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import connectDB from './config/db.js';
import cookieParser from 'cookie-parser';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://legendary-barnacle-nu.vercel.app',
  // Your frontend URL will go here as well
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes

app.use('/api/ideas', ideaRouter);
app.use('/api/auth', authRouter);

// Connect to MongoDB
connectDB();

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass to error handler
});

app.use(errorHandler);  // has to be after routes


/* 
app.get('/api/ideas', (req, res) => {
  const ideas = [
    { id: 1, title: 'Idea 1', description: 'Description for Idea 1' },
    { id: 2, title: 'Idea 2', description: 'Description for Idea 2' },
    { id: 3, title: 'Idea 3', description: 'Description for Idea 3' },
  ];
  res.json(ideas);
});

app.post('/api/ideas', (req, res) => {
  //console.log(req.body)
  //res.send('processed')
  //const { title } = req.body || {};
  //res.send(title)

  const { title, description } = req.body || {};
  const newIdea = { id: Date.now(), title, description };
  //newIdea.id = Date.now(); // Simulate an ID for the new idea
  res.status(201).json(newIdea);
});
 */

app.get('/error', (req, res) => {
  throw new Error('This is a test error!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
