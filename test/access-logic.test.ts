import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app';
import { store } from '../src/store';

describe('Sample File Access Service - Access Logic Tests', () => {
  beforeEach(() => {
    store.reset();
  });

  it('should allow owner to download a file when QC status is passed', async () => {
    // 1. User 1 registers sample
    const sampleRes = await request(app)
      .post('/sample')
      .set('x-api-key', 'user1-key')
      .send({ sampleName: 'Cancer Sample 1', files: ['genome.bam'] })
      .expect(201);

    const fileId = sampleRes.body.files[0].fileId;

    // 2. Pipeline updates QC status to passed
    await request(app)
      .patch(`/file/${fileId}/qc`)
      .set('x-api-key', 'pipeline-key')
      .send({ qcStatus: 'passed' })
      .expect(200);

    // 3. Owner requests download
    const downloadRes = await request(app)
      .get(`/file/${fileId}/download-request`)
      .set('x-api-key', 'user1-key')
      .expect(200);

    assert.ok(downloadRes.body.downloadURL.includes(fileId));
    assert.equal(downloadRes.body.fileId, fileId);
    assert.ok(downloadRes.body.expiration_timestamp);
  });

  it('should allow granted user to download a file when QC status is passed', async () => {
    // 1. User 1 registers sample
    const sampleRes = await request(app)
      .post('/sample')
      .set('x-api-key', 'user1-key')
      .send({ sampleName: 'Cancer Sample 2', files: ['rnaseq.bam'] })
      .expect(201);

    const sampleId = sampleRes.body.sampleId;
    const fileId = sampleRes.body.files[0].fileId;

    // 2. Pipeline updates QC status to passed
    await request(app)
      .patch(`/file/${fileId}/qc`)
      .set('x-api-key', 'pipeline-key')
      .send({ qcStatus: 'passed' })
      .expect(200);

    // 3. User 1 grants access to User 2
    await request(app)
      .post(`/sample/${sampleId}/access`)
      .set('x-api-key', 'user1-key')
      .send({ userId: 'user-2' })
      .expect(200);

    // 4. User 2 requests download
    const downloadRes = await request(app)
      .get(`/file/${fileId}/download-request`)
      .set('x-api-key', 'user2-key')
      .expect(200);

    assert.ok(downloadRes.body.downloadURL.includes(fileId));
    assert.equal(downloadRes.body.fileId, fileId);
    assert.ok(downloadRes.body.expiration_timestamp);
  });

  it('should deny download to user without permission even if QC is passed', async () => {
    // 1. User 1 registers sample
    const sampleRes = await request(app)
      .post('/sample')
      .set('x-api-key', 'user1-key')
      .send({ sampleName: 'Private Sample', files: ['private.bam'] })
      .expect(201);

    const fileId = sampleRes.body.files[0].fileId;

    // 2. Pipeline marks QC passed
    await request(app)
      .patch(`/file/${fileId}/qc`)
      .set('x-api-key', 'pipeline-key')
      .send({ qcStatus: 'passed' })
      .expect(200);

    // 3. User 2 (not permitted) requests download
    const res = await request(app)
      .get(`/file/${fileId}/download-request`)
      .set('x-api-key', 'user2-key')
      .expect(403);

    assert.equal(res.body.reason, 'User lacks permission');
  });

  it('should deny download to owner if QC status is pending', async () => {
    // 1. User 1 registers sample (starts with QC pending)
    const sampleRes = await request(app)
      .post('/sample')
      .set('x-api-key', 'user1-key')
      .send({ sampleName: 'Pending Sample', files: ['pending.bam'] })
      .expect(201);

    const fileId = sampleRes.body.files[0].fileId;

    // 2. Owner requests download while QC is pending
    const res = await request(app)
      .get(`/file/${fileId}/download-request`)
      .set('x-api-key', 'user1-key')
      .expect(403);

    assert.equal(res.body.reason, 'User lacks permission');
  });

  it('should deny download to permitted user if QC status is failed', async () => {
    // 1. User 1 registers sample
    const sampleRes = await request(app)
      .post('/sample')
      .set('x-api-key', 'user1-key')
      .send({ sampleName: 'Failed Sample', files: ['corrupted.bam'] })
      .expect(201);

    const fileId = sampleRes.body.files[0].fileId;

    // 2. Pipeline updates QC status to failed
    await request(app)
      .patch(`/file/${fileId}/qc`)
      .set('x-api-key', 'pipeline-key')
      .send({ qcStatus: 'failed' })
      .expect(200);

    // 3. Owner requests download
    const res = await request(app)
      .get(`/file/${fileId}/download-request`)
      .set('x-api-key', 'user1-key')
      .expect(403);

    assert.equal(res.body.reason, 'User lacks permission');
  });

  it('should deny non-owner from granting access to a sample', async () => {
    // 1. User 1 registers sample
    const sampleRes = await request(app)
      .post('/sample')
      .set('x-api-key', 'user1-key')
      .send({ sampleName: 'User 1 Sample', files: ['file.bam'] })
      .expect(201);

    const sampleId = sampleRes.body.sampleId;

    // 2. User 2 tries to grant access to User 2
    const res = await request(app)
      .post(`/sample/${sampleId}/access`)
      .set('x-api-key', 'user2-key')
      .send({ userId: 'user-2' })
      .expect(403);

    assert.equal(res.body.reason, 'User lacks permission');
  });

  it('should return 401 when authentication is missing or invalid', async () => {
    // Missing header
    const res1 = await request(app)
      .get('/file/any-file/download-request')
      .expect(401);
    assert.equal(res1.body.reason, 'Authentication is missing or invalid');

    // Invalid header
    const res2 = await request(app)
      .get('/file/any-file/download-request')
      .set('x-api-key', 'invalid-key')
      .expect(401);
    assert.equal(res2.body.reason, 'Authentication is missing or invalid');
  });

  it('should deny non-pipeline user from updating QC status', async () => {
    // 1. User 1 registers sample
    const sampleRes = await request(app)
      .post('/sample')
      .set('x-api-key', 'user1-key')
      .send({ sampleName: 'Sample', files: ['file.bam'] })
      .expect(201);

    const fileId = sampleRes.body.files[0].fileId;

    // 2. User 1 attempts to call QC callback
    const res = await request(app)
      .patch(`/file/${fileId}/qc`)
      .set('x-api-key', 'user1-key')
      .send({ qcStatus: 'passed' })
      .expect(403);

    assert.equal(res.body.reason, 'User lacks permission');
  });
});
