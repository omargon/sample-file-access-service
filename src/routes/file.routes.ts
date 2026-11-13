import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requirePipeline } from '../middleware/auth';
import { fileService } from '../services/file.service';
import { UpdateQCStatusRequest, UpdateQCStatusResponse, ErrorResponse } from '../types';

const router = Router();

router.patch(
  '/file/:id/qc',
  authenticate,
  requirePipeline,
  (
    req: Request<{ id: string }, UpdateQCStatusResponse | ErrorResponse, UpdateQCStatusRequest>,
    res: Response<UpdateQCStatusResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    try {
      const fileId = req.params.id;
      const { qcStatus } = req.body;

      const result = fileService.updateQCStatus(fileId, qcStatus);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export { router as fileRouter };
