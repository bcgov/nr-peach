import cors from 'cors';
import express from 'express';
// import routes from './routes/index.ts';

import type { Request, Response } from 'express';

const app = express();
app.use(express.json());
app.use(cors());

// app.use('/api', routes);

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello, World!');
});

export default app;
