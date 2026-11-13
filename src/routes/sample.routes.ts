import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { sampleService } from '../services/sample.service';
import {
  RegisterSampleRequest,
  RegisterSampleResponse,
  GrantAccessRequest,
  GrantAccessResponse,
  ErrorResponse,
} from '../types';

const router = Router();

router.post(
  '/sample',
  authenticate,
  (
    req: Request<object, RegisterSampleResponse | ErrorResponse, RegisterSampleRequest>,
    res: Response<RegisterSampleResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    try {
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
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/sample/:id/access',
  authenticate,
  (
    req: Request<{ id: string }, GrantAccessResponse | ErrorResponse, GrantAccessRequest>,
    res: Response<GrantAccessResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    try {
      const sampleId = req.params.id;
      const { userId } = req.body;

      if (!userId || typeof userId !== 'string' || !userId.trim()) {
        res.status(400).json({ reason: 'userId is required and must be a non-empty string' });
        return;
      }

      const result = sampleService.grantAccess(req.user!.id, sampleId, userId.trim());
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export { router as sampleRouter };
