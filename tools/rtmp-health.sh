#!/usr/bin/env bash
# Usage: tools/rtmp-health.sh <live_stream_id>
# Returns: JSON with live stream health status from SM2 API + HLS probe

set -euo pipefail

LIVE_ID="${1:?Usage: rtmp-health.sh <live_stream_id>}"
BASE_URL="${BASE_URL:-https://dev.platform.mediastre.am}"
API_TOKEN="${SM2_API_TOKEN:-}"
ACCOUNT_ID="${ACCOUNT_ID:-}"

if [[ -z "$API_TOKEN" ]]; then
  echo '{"error": "SM2_API_TOKEN not set"}' >&2
  exit 1
fi

# Get live stream details from API
api_response=$(curl -sf \
  --max-time 10 \
  -H "X-API-Token: $API_TOKEN" \
  -H "X-Account-Id: $ACCOUNT_ID" \
  -H "Accept: application/json" \
  "${BASE_URL}/api/live/${LIVE_ID}" 2>&1) || {
  echo "{\"live_id\": \"$LIVE_ID\", \"error\": \"API request failed\"}"
  exit 0
}

python3 -c "
import json, sys, subprocess, urllib.request

data = json.loads('''$api_response''')
live_id = '$LIVE_ID'

status = data.get('status') or 'unknown'
rtmp_url = data.get('rtmp_url') or data.get('ingest_url') or None
hls_url = data.get('hls_url') or data.get('playback_url') or None
rtmp_credentials = data.get('rtmp_credentials') or {}

# Probe HLS endpoint if available
hls_reachable = False
if hls_url:
    try:
        req = urllib.request.Request(hls_url, headers={'User-Agent': 'QA-Health-Check'})
        resp = urllib.request.urlopen(req, timeout=5)
        hls_reachable = resp.status == 200
    except Exception:
        pass

result = {
    'live_id': live_id,
    'status': status,
    'is_live': status in ['live', 'broadcasting', 'active'],
    'rtmp_configured': bool(rtmp_url),
    'rtmp_url_present': bool(rtmp_credentials.get('url') or rtmp_url),
    'stream_key_present': bool(rtmp_credentials.get('stream_key') or rtmp_credentials.get('key')),
    'hls_url_present': bool(hls_url),
    'hls_reachable': hls_reachable,
}

print(json.dumps(result, indent=2))
" 2>/dev/null || echo "{\"live_id\": \"$LIVE_ID\", \"error\": \"health check failed\", \"raw\": $(echo '$api_response' | head -c 200)}"
