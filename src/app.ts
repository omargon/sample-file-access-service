import express, { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from './types';

const app = express();

app.use(express.json());

// 404 handler for unknown endpoints
app.use((_req: Request, res: Response<ErrorResponse>) => {
  res.status(404).json({ reason: 'The requested endpoint or resource ID does not exist' });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) => {
  res.status(500).json({ reason: 'Internal service error, please try again' });
});

export { app };
