export { uploadVideoFlow } from './upload-video.js';
export { createLivestreamFlow } from './create-livestream.js';
export { createAdFlow } from './create-ad.js';

export const ALL_FLOWS = [
  (await import('./upload-video.js')).uploadVideoFlow,
  (await import('./create-livestream.js')).createLivestreamFlow,
  (await import('./create-ad.js')).createAdFlow,
];
