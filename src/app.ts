import express, { Request, Response, NextFunction } from 'express';
import { sampleRouter } from './routes/sample.routes';
import { fileRouter } from './routes/file.routes';
import { AppError } from './errors';
import { ErrorResponse } from './types';

const app = express();

app.use(express.json());

// Routes
app.use(sampleRouter);
app.use(fileRouter);

// 404 handler for unknown endpoints
app.use((_req: Request, res: Response<ErrorResponse>) => {
  res.status(404).json({ reason: 'The requested endpoint or resource ID does not exist' });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ reason: err.reason });
    return;
  }
  res.status(500).json({ reason: 'Internal service error, please try again' });
});

export { app };
