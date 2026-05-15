import type { Request, Response } from 'express';

export const validationSuccessController = (_req: Request, res: Response): void => {
  res.status(200).end();
};
