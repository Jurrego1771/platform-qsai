/**
 * Regression for PR #8323 / issue-8322 "Fix restreaming"
 *
 * Verifies the pre-validate hook in event_restreaming.js enforces required fields:
 * - custom: publishing_point + stream_id required
 * - social:  social_id + social_type required
 *
 * Also verifies the full delete lifecycle (resource returns 404 after deletion).
 */

import { test, expect } from '@playwright/test';
import { SmApi } from '../../../utils/smApi.js';
import { DataFactory } from '../../../utils/dataFactory.js';
import { ResourceCleaner } from '../../../utils/resourceCleaner.js';

test.describe('TC_LIVE_REG_003 — Restream: field validation and delete lifecycle', {
  tag: ['@live', '@regression', '@pr-8323'],
}, () => {
  let api;
  let cleaner;
  let liveStreamId;

  test.beforeAll(async () => {
    api = new SmApi();
    cleaner = new ResourceCleaner();

    const liveRes = await api.post('/live-stream', DataFactory.generateLiveStreamPayload());
    liveStreamId = liveRes.data._id;
    cleaner.trackLiveStream(liveStreamId);
  });

  test.afterAll(async () => {
    await cleaner.cleanupAll();
  });

  // ── Required fields: custom type ──────────────────────────────────────────

  test('Custom restream without publishing_point is rejected with 400', async () => {
    await expect(
      api.post(`/live-stream/${liveStreamId}/restream`, {
        name: '[QA-REG] Missing publishing_point',
        type: 'custom',
        // publishing_point intentionally omitted
        stream_id: 'some-stream-key',
      })
    ).rejects.toThrow(/400/);
  });

  test('Custom restream without stream_id is rejected with 400', async () => {
    await expect(
      api.post(`/live-stream/${liveStreamId}/restream`, {
        name: '[QA-REG] Missing stream_id',
        type: 'custom',
        publishing_point: 'rtmp://ingest.example.com/live',
        // stream_id intentionally omitted
      })
    ).rejects.toThrow(/400/);
  });

  // ── Required fields: social type ──────────────────────────────────────────

  test('Social restream without social_id is rejected with 400', async () => {
    await expect(
      api.post(`/live-stream/${liveStreamId}/restream`, {
        name: '[QA-REG] Missing social_id',
        type: 'social',
        // social_id intentionally omitted
        social_type: 'youtube',
      })
    ).rejects.toThrow(/400/);
  });

  test('Social restream without social_type is rejected with 400', async () => {
    await expect(
      api.post(`/live-stream/${liveStreamId}/restream`, {
        name: '[QA-REG] Missing social_type',
        type: 'social',
        social_id: 'some-account-id',
        // social_type intentionally omitted
      })
    ).rejects.toThrow(/400/);
  });

  // ── Delete lifecycle ──────────────────────────────────────────────────────

  test('Deleted restream returns 404 on subsequent GET', async () => {
    // Create a temporary custom restream
    const createRes = await api.post(`/live-stream/${liveStreamId}/restream`, {
      name: '[QA-REG] To be deleted',
      type: 'custom',
      publishing_point: 'rtmp://ingest.example.com/live',
      stream_id: 'delete-test-key',
    });
    expect(createRes.status).toBe('OK');
    const restreamId = createRes.data._id;

    // Verify it exists
    const detail = await api.get(`/live-stream/${liveStreamId}/restream/${restreamId}`);
    expect(detail.status).toBe('OK');

    // Delete it — SmApi.delete() throws on non-2xx, so no exception means success
    await api.delete(`/live-stream/${liveStreamId}/restream/${restreamId}`);

    // Verify it no longer exists
    await expect(
      api.get(`/live-stream/${liveStreamId}/restream/${restreamId}`)
    ).rejects.toThrow(/404/);
  });

  test('Deleted restream does not appear in the restream list', async () => {
    // Create
    const createRes = await api.post(`/live-stream/${liveStreamId}/restream`, {
      name: '[QA-REG] List check delete',
      type: 'custom',
      publishing_point: 'rtmp://ingest.example.com/live',
      stream_id: 'list-delete-key',
    });
    const restreamId = createRes.data._id;

    // Delete
    await api.delete(`/live-stream/${liveStreamId}/restream/${restreamId}`);

    // List should not contain the deleted restream
    const listRes = await api.get(`/live-stream/${liveStreamId}/restream`);
    expect(listRes.status).toBe('OK');
    const ids = listRes.data.map(r => r._id);
    expect(ids).not.toContain(restreamId);
  });
});
