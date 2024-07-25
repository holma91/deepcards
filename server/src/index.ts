import express from 'express';
import cardsRouter from './routes/cards';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('DeepFlash API is running');
});

app.use('/api/cards', cardsRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
