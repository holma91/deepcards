import express from 'express';
import cardsRouter from './routes/cards';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/', (req, res) => {
  res.send('DeepFlash API is running');
});

app.use('/api/cards', cardsRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
