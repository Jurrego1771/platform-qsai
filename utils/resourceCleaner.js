import { SmApi } from './smApi.js';

export class ResourceCleaner {
  constructor() {
    this.stack = [];
    this.api = new SmApi();
  }

  track(type, ids) {
    this.stack.push({ type, ids });
  }

  trackMedia(mediaId) { this.track('media', { mediaId }); }
  trackAd(adId) { this.track('ad', { adId }); }
  trackVmap(vmapId) { this.track('vmap', { vmapId }); }
  trackLiveStream(liveId) { this.track('live-stream', { liveId }); }
  trackRestream(liveId, restreamId) { this.track('restream', { liveId, restreamId }); }
  trackShow(showId) { this.track('show', { showId }); }
  trackSeason(showId, seasonId) { this.track('season', { showId, seasonId }); }
  trackEpisode(showId, seasonId, episodeId) { this.track('episode', { showId, seasonId, episodeId }); }
  trackChannel(channelId) { this.track('channel', { channelId }); }
  trackCustomer(customerId) { this.track('customer', { customerId }); }
  trackCategory(categoryId) { this.track('category', { categoryId }); }
  trackPlayer(playerId) { this.track('player', { playerId }); }
  trackAccessRestriction(restrictionId) { this.track('access-restriction', { restrictionId }); }

  async cleanupAll() {
    const reversed = [...this.stack].reverse();
    const errors = [];

    for (const { type, ids } of reversed) {
      try {
        await this.#delete(type, ids);
      } catch (e) {
        errors.push({ type, ids, error: e.message });
      }
    }

    this.stack = [];

    if (errors.length > 0) {
      console.warn('[ResourceCleaner] Cleanup errors:', errors);
    }
  }

  async #delete(type, ids) {
    switch (type) {
      case 'media':
        await this.api.delete(`/media/${ids.mediaId}`);
        break;
      case 'ad':
        await this.api.delete(`/ad/${ids.adId}`);
        break;
      case 'vmap':
        await this.api.delete(`/vmap/${ids.vmapId}`);
        break;
      case 'live-stream':
        await this.api.delete(`/live-stream/${ids.liveId}`);
        break;
      case 'restream':
        await this.api.delete(`/live-stream/${ids.liveId}/restream/${ids.restreamId}`);
        break;
      case 'show':
        await this.api.delete(`/show/${ids.showId}`);
        break;
      case 'season':
        await this.api.delete(`/show/${ids.showId}/season/${ids.seasonId}`);
        break;
      case 'episode':
        await this.api.delete(`/show/${ids.showId}/season/${ids.seasonId}/episode/${ids.episodeId}`);
        break;
      case 'channel':
        await this.api.delete(`/channel/${ids.channelId}`);
        break;
      case 'customer':
        // Customers are deactivated, not deleted (to preserve billing history)
        await this.api.patch(`/customer/${ids.customerId}`, { status: 'inactive' });
        break;
      case 'category':
        await this.api.delete(`/category/${ids.categoryId}`);
        break;
      case 'player':
        await this.api.delete(`/player/${ids.playerId}`);
        break;
      case 'access-restriction':
        await this.api.delete(`/access-restriction/${ids.restrictionId}`);
        break;
      default:
        throw new Error(`Unknown resource type: ${type}`);
    }
  }
}
