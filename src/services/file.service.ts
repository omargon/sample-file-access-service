import { store } from '../store';
import { QCStatus, UpdateQCStatusResponse } from '../types';
import { NotFoundError, BadRequestError } from '../errors';

export class FileService {
  public updateQCStatus(
    fileId: string,
    qcStatus: QCStatus
  ): UpdateQCStatusResponse {
    if (qcStatus !== 'passed' && qcStatus !== 'failed') {
      throw new BadRequestError("qcStatus must be either 'passed' or 'failed'");
    }

    const file = store.getFile(fileId);
    if (!file) {
      throw new NotFoundError();
    }

    file.qcStatus = qcStatus;
    store.saveFile(file);

    return {
      fileId: file.id,
      qcStatus: file.qcStatus,
      message: 'File QC status updated',
    };
  }
}

export const fileService = new FileService();
