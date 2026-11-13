import { randomUUID } from 'node:crypto';
import { store } from '../store';
import { Sample, FileRecord, RegisterSampleResponse, FileSummary } from '../types';

export class SampleService {
  public createSample(
    ownerId: string,
    sampleName: string,
    fileNames?: string[]
  ): RegisterSampleResponse {
    const sampleId = `sample_${randomUUID()}`;
    const fileIds: string[] = [];
    const filesSummary: FileSummary[] = [];

    if (Array.isArray(fileNames)) {
      for (const fileName of fileNames) {
        const fileId = `file_${randomUUID()}`;
        const fileRecord: FileRecord = {
          id: fileId,
          name: fileName,
          sampleId,
          qcStatus: 'pending',
        };
        store.saveFile(fileRecord);
        fileIds.push(fileId);
        filesSummary.push({
          fileId,
          fileName,
          qcStatus: 'pending',
        });
      }
    }

    const sample: Sample = {
      id: sampleId,
      name: sampleName,
      ownerId,
      fileIds,
      grantedUserIds: new Set<string>(),
    };

    store.saveSample(sample);

    return {
      sampleId,
      sampleName,
      files: filesSummary,
    };
  }
}

export const sampleService = new SampleService();
