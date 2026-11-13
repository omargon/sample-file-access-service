import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sampleService } from '../services/sample.service';
import { RegisterSampleRequest, RegisterSampleResponse, ErrorResponse } from '../types';

const router = Router();

router.post(
  '/sample',
  authenticate,
  (
    req: Request<object, RegisterSampleResponse | ErrorResponse, RegisterSampleRequest>,
    res: Response<RegisterSampleResponse | ErrorResponse>
  ) => {
    const { sampleName, files } = req.body;

    if (!sampleName || typeof sampleName !== 'string' || !sampleName.trim()) {
      res.status(400).json({ reason: 'sampleName is required and must be a non-empty string' });
      return;
    }

    if (files !== undefined && (!Array.isArray(files) || files.some((f) => typeof f !== 'string'))) {
      res.status(400).json({ reason: 'files must be an array of file name strings' });
      return;
    }

    const result = sampleService.createSample(
      req.user!.id,
      sampleName.trim(),
      files
    );

    res.status(201).json(result);
  }
);

export { router as sampleRouter };
