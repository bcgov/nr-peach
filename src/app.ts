import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { randomBytes } from 'node:crypto';
import favicon from 'serve-favicon';

import router from './routes/index.ts';

import type { Request, Response } from 'express';

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(favicon('src/public/favicon.ico'));
app.use((_req: Request, res: Response, next): void => {
  res.locals.cspNonce = randomBytes(32).toString('hex');
  helmet();
  next();
});

app.use(router);

export default app;
