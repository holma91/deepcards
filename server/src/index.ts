import express from 'express';
import cors from 'cors';
import cardsRouter from './routes/cards';
import decksRouter from './routes/decks';
import chatRouter from './routes/chat';
import chatsRouter from './routes/chats';
import suggestionsRouter from './routes/suggestions';
import profilesRouter from './routes/profiles';
import rateLimit from 'express-rate-limit';

const app = express();

// Ensure required environment variables are set
const port = process.env.PORT || 8080;
const frontendUrl = process.env.FRONTEND_URL;

if (!port) {
  console.error('PORT environment variable is not set');
  process.exit(1);
}

if (!frontendUrl) {
  console.error('FRONTEND_URL environment variable is not set');
  process.exit(1);
}

app.use(express.json());
app.use(
  cors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const shortTermLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Limit each IP to 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});

app.use(shortTermLimiter);

app.get('/', (req, res) => {
  res.send('Deepcards API is running');
});

app.use('/api/profiles', profilesRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/decks', decksRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/suggestions', suggestionsRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
