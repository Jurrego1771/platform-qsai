#!/usr/bin/env bash
# Usage: tools/vast-validate.sh <vast_url>
# Returns: JSON indicating if the VAST URL is reachable and returns valid XML

set -euo pipefail

VAST_URL="${1:?Usage: vast-validate.sh <vast_url>}"

# Fetch the VAST URL with timeout
response=$(curl -sf \
  --max-time 10 \
  --connect-timeout 5 \
  -L \
  -o /tmp/vast-response.xml \
  -w "%{http_code}" \
  "$VAST_URL" 2>&1) || {
  echo "{\"url\": \"$VAST_URL\", \"reachable\": false, \"error\": \"curl failed: $response\"}"
  exit 0
}

http_code="$response"
content=$(cat /tmp/vast-response.xml 2>/dev/null | head -c 2000 || echo "")

python3 -c "
import json, sys

url = '''$VAST_URL'''
http_code = '''$http_code'''
content = open('/tmp/vast-response.xml', 'r', errors='replace').read()[:2000]

is_xml = content.strip().startswith('<?xml') or '<VAST' in content
has_vast_tag = '<VAST' in content
has_ad = '<Ad' in content
has_creative = '<Creative' in content or '<MediaFile' in content

result = {
    'url': url,
    'http_code': int(http_code) if http_code.isdigit() else 0,
    'reachable': http_code == '200',
    'is_valid_xml': is_xml,
    'has_vast_tag': has_vast_tag,
    'has_ad': has_ad,
    'has_creative': has_creative,
    'valid': http_code == '200' and has_vast_tag,
    'content_preview': content[:200] if content else None
}

print(json.dumps(result, indent=2))
" 2>/dev/null || echo "{\"url\": \"$VAST_URL\", \"error\": \"validation failed\"}"

rm -f /tmp/vast-response.xml
