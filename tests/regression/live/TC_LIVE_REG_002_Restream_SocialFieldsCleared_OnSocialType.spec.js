/**
 * Regression for PR #8323 / issue-8322 "Fix restreaming"
 *
 * Complementary test: verifies the social restream path still works correctly.
 * When type='social', publishing_point and stream_id SHOULD be cleared on save
 * (they are custom-only fields). This ensures the fix didn't break social restreamings.
 */

import { test, expect } from '@playwright/test';
import { SmApi } from '../../../utils/smApi.js';
import { DataFactory } from '../../../utils/dataFactory.js';
import { ResourceCleaner } from '../../../utils/resourceCleaner.js';

test.describe('TC_LIVE_REG_002 — Social restream: custom fields cleared correctly on save', {
  tag: ['@live', '@regression', '@pr-8323'],
}, () => {
  let api;
  let cleaner;
  let liveStreamId;
  let restreamId;

  test.beforeAll(async () => {
    api = new SmApi();
    cleaner = new ResourceCleaner();

    const livePayload = DataFactory.generateLiveStreamPayload();
    const liveRes = await api.post('/live-stream', livePayload);
    liveStreamId = liveRes.data._id;
    cleaner.trackLiveStream(liveStreamId);
  });

  test.afterAll(async () => {
    await cleaner.cleanupAll();
  });

  test('Social restream is created — publishing_point and stream_id are absent', async () => {
    const restreamRes = await api.post(`/live-stream/${liveStreamId}/restream`, {
      name: `[QA-REG] Restream social ${Date.now()}`,
      type: 'social',
      social_id: 'test-social-account-id',
      social_type: 'youtube',
      title: 'QA Test Stream',
      description: 'Regression test social restream',
    });

    expect(restreamRes.status, 'Social restream creation should succeed').toBe('OK');
    restreamId = restreamRes.data._id;
    cleaner.trackRestream(liveStreamId, restreamId);

    // social_id and social_type must be present
    expect(restreamRes.data.type).toBe('social');
    expect(restreamRes.data.social_id).toBe('test-social-account-id');
    expect(restreamRes.data.social_type).toBe('youtube');

    // publishing_point and stream_id must be absent (cleared by pre-save hook)
    expect(restreamRes.data.publishing_point).toBeFalsy();
    expect(restreamRes.data.stream_id).toBeFalsy();
  });

  test('Social restream detail confirms publishing_point/stream_id cleared', async () => {
    const detail = await api.get(`/live-stream/${liveStreamId}/restream/${restreamId}`);
    expect(detail.status).toBe('OK');
    expect(detail.data.type).toBe('social');
    expect(detail.data.publishing_point).toBeFalsy();
    expect(detail.data.stream_id).toBeFalsy();
    expect(detail.data.social_id).toBeTruthy();
    expect(detail.data.social_type).toBeTruthy();
  });
});
