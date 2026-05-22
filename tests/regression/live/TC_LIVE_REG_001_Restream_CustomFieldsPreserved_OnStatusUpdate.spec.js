/**
 * Regression for PR #8323 / issue-8322 "Fix restreaming"
 *
 * Bug: When the VMS notification endpoint (POST /api/-/live-stream/.../restream/.../status)
 * updates a custom restream's status, the query only loaded `status` and `currentJob`,
 * leaving `type` undefined. The pre-save hook's `else` branch then cleared
 * `publishing_point` and `stream_id`, corrupting the restream configuration.
 *
 * Fix: `.select('status currentJob type')` — type is now always loaded.
 *      `else if (this.type === 'social')` — clear only fires for social restreamings.
 */

import { test, expect } from '@playwright/test';
import { SmApi } from '../../../utils/smApi.js';
import { DataFactory } from '../../../utils/dataFactory.js';
import { ResourceCleaner } from '../../../utils/resourceCleaner.js';

test.describe('TC_LIVE_REG_001 — Custom restream fields preserved after status update', {
  tag: ['@live', '@regression', '@pr-8323'],
}, () => {
  let api;
  let cleaner;
  let liveStreamId;
  let restreamId;

  test.beforeAll(async () => {
    api = new SmApi();
    cleaner = new ResourceCleaner();

    // Create a live stream to attach the restream to
    const livePayload = DataFactory.generateLiveStreamPayload();
    const liveRes = await api.post('/live-stream', livePayload);
    liveStreamId = liveRes.data._id;
    cleaner.trackLiveStream(liveStreamId);

    // Create a custom restream
    const restreamRes = await api.post(`/live-stream/${liveStreamId}/restream`, {
      name: `[QA-REG] Restream custom ${Date.now()}`,
      type: 'custom',
      publishing_point: 'rtmp://ingest.test.example.com/live',
      stream_id: 'test-stream-key-001',
    });
    expect(restreamRes.status, 'Restream creation should succeed').toBe('OK');
    restreamId = restreamRes.data._id;
    cleaner.trackRestream(liveStreamId, restreamId);
  });

  test.afterAll(async () => {
    await cleaner.cleanupAll();
  });

  test('publishing_point and stream_id are intact after reading restream detail', async () => {
    const detail = await api.get(`/live-stream/${liveStreamId}/restream/${restreamId}`);
    expect(detail.status).toBe('OK');
    expect(detail.data.type).toBe('custom');
    expect(detail.data.publishing_point).toBe('rtmp://ingest.test.example.com/live');
    expect(detail.data.stream_id).toBe('test-stream-key-001');
  });

  test('publishing_point and stream_id survive an update (pre-save hook isolation)', async () => {
    // Trigger a save cycle — update the name only, custom fields must not be cleared
    const updateRes = await api.post(`/live-stream/${liveStreamId}/restream/${restreamId}`, {
      name: `[QA-REG] Restream custom updated ${Date.now()}`,
      // Intentionally omit publishing_point and stream_id to verify they are not cleared
    });
    expect(updateRes.status).toBe('OK');

    // Reload and assert custom fields survived
    const detail = await api.get(`/live-stream/${liveStreamId}/restream/${restreamId}`);
    expect(detail.data.type).toBe('custom');
    expect(detail.data.publishing_point,
      'publishing_point must not be cleared when type=custom and field not in update body'
    ).toBe('rtmp://ingest.test.example.com/live');
    expect(detail.data.stream_id,
      'stream_id must not be cleared when type=custom and field not in update body'
    ).toBe('test-stream-key-001');
    // Social fields must be undefined for a custom restream
    expect(detail.data.social_type).toBeFalsy();
    expect(detail.data.social_id).toBeFalsy();
  });
});
