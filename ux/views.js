import fs from 'fs';

function loadSampleIds() {
  try {
    const raw = fs.readFileSync('./memory/coverage.json', 'utf8');
    const data = JSON.parse(raw);
    const ids = {};
    for (const [module, info] of Object.entries(data)) {
      if (info.sampleIds) Object.assign(ids, info.sampleIds);
    }
    return ids;
  } catch {
    return {};
  }
}

export function buildViews() {
  const ids = loadSampleIds();

  const parametric = (template, idKey, priority = 'medium') => {
    const id = ids[idKey];
    if (!id) return null;
    return { name: template.replace(':id', idKey), path: template.replace(':id', id), priority, parametric: true };
  };

  const views = [
    // Auth
    { name: 'auth-login', path: '/login', module: 'platform', priority: 'high' },

    // Dashboard
    { name: 'dashboard', path: '/', module: 'platform', priority: 'high' },

    // Media
    { name: 'media-list',   path: '/media',        module: 'media', priority: 'high' },
    { name: 'media-create', path: '/media/create', module: 'media', priority: 'high' },
    parametric('/media/:id', 'mediaId', 'medium'),

    // Live
    { name: 'live-list',   path: '/live',        module: 'live', priority: 'high' },
    { name: 'live-create', path: '/live/create', module: 'live', priority: 'high' },
    parametric('/live/:id', 'liveId', 'medium'),

    // Ads
    { name: 'ad-list',   path: '/ad',        module: 'ads', priority: 'high' },
    { name: 'ad-create', path: '/ad/create', module: 'ads', priority: 'high' },
    parametric('/ad/:id', 'adId', 'high'),

    // VMAP
    { name: 'vmap-list',   path: '/vmap',        module: 'ads', priority: 'medium' },
    { name: 'vmap-create', path: '/vmap/create', module: 'ads', priority: 'medium' },
    parametric('/vmap/:id', 'vmapId', 'medium'),

    // Customer
    { name: 'customer-list', path: '/customer', module: 'customer', priority: 'high' },
    parametric('/customer/:id', 'customerId', 'high'),

    // Access restrictions (customer module)
    { name: 'access-restriction-list',   path: '/access-restriction',        module: 'customer', priority: 'medium' },
    { name: 'access-restriction-create', path: '/access-restriction/create', module: 'customer', priority: 'medium' },

    // Shows
    { name: 'show-list',   path: '/show',        module: 'show', priority: 'medium' },
    { name: 'show-create', path: '/show/create', module: 'show', priority: 'medium' },
    parametric('/show/:id', 'showId', 'medium'),

    // Channels
    { name: 'channel-list',   path: '/channel',        module: 'channel', priority: 'medium' },
    { name: 'channel-create', path: '/channel/create', module: 'channel', priority: 'medium' },
    parametric('/channel/:id', 'channelId', 'medium'),

    // EPG
    { name: 'epg-list', path: '/epg', module: 'channel', priority: 'low' },
    parametric('/epg/:id', 'epgId', 'low'),

    // Analytics
    { name: 'analytics-overview', path: '/analytics',       module: 'analytics', priority: 'medium' },
    { name: 'analytics-media',    path: '/analytics/media', module: 'analytics', priority: 'medium' },
    { name: 'analytics-live',     path: '/analytics/live',  module: 'analytics', priority: 'medium' },
    { name: 'analytics-ads',      path: '/analytics/ads',   module: 'analytics', priority: 'low' },

    // Categories
    { name: 'category-list',   path: '/category',        module: 'platform', priority: 'low' },
    { name: 'category-create', path: '/category/create', module: 'platform', priority: 'low' },

    // Players / embeds
    { name: 'player-list',   path: '/player',        module: 'platform', priority: 'low' },
    { name: 'player-create', path: '/player/create', module: 'platform', priority: 'low' },

    // Settings
    { name: 'settings-general', path: '/settings',         module: 'platform', priority: 'low' },
    { name: 'settings-account', path: '/settings/account', module: 'platform', priority: 'low' },
    { name: 'settings-api',     path: '/settings/api',     module: 'platform', priority: 'low' },
  ].filter(Boolean);

  return views;
}

export const ALL_VIEWS = buildViews();

export function getViewsByModule(module) {
  return ALL_VIEWS.filter(v => v.module === module);
}

export function getViewsByNames(names) {
  return names.map(name => ALL_VIEWS.find(v => v.name === name)).filter(Boolean);
}

export function getViewsByPriority(priority) {
  return ALL_VIEWS.filter(v => v.priority === priority);
}
