import express from 'express';
import cors from 'cors';
import cardsRouter from './routes/cards';
import decksRouter from './routes/decks';
import chatRouter from './routes/chat';
import chatsRouter from './routes/chats';
import suggestionsRouter from './routes/suggestions';
import profilesRouter from './routes/profiles';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

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
