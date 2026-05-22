#!/usr/bin/env bash
# Usage: tools/ffmpeg-check.sh <media_id>
# Returns: JSON with transcoding status from SM2 API

set -euo pipefail

MEDIA_ID="${1:?Usage: ffmpeg-check.sh <media_id>}"
BASE_URL="${BASE_URL:-https://dev.platform.mediastre.am}"
API_TOKEN="${SM2_API_TOKEN:-}"
ACCOUNT_ID="${ACCOUNT_ID:-}"

if [[ -z "$API_TOKEN" ]]; then
  echo '{"error": "SM2_API_TOKEN not set"}' >&2
  exit 1
fi

response=$(curl -sf \
  -H "X-API-Token: $API_TOKEN" \
  -H "X-Account-Id: $ACCOUNT_ID" \
  -H "Accept: application/json" \
  "${BASE_URL}/api/media/${MEDIA_ID}" 2>&1) || {
  echo "{\"error\": \"API request failed\", \"details\": \"$response\"}"
  exit 1
}

echo "$response" | python3 -c "
import json, sys
data = json.load(sys.stdin)
status = data.get('transcoding_status') or data.get('status') or 'unknown'
progress = data.get('transcoding_progress') or data.get('progress') or 0
result = {
  'media_id': '$MEDIA_ID',
  'status': status,
  'progress': progress,
  'is_transcoding': status in ['processing', 'transcoding', 'pending'],
  'is_ready': status in ['ready', 'published', 'live'],
  'has_error': status in ['error', 'failed']
}
print(json.dumps(result, indent=2))
" 2>/dev/null || echo "$response"
