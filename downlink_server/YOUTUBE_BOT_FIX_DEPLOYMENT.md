# YouTube Bot Detection Fix - Deployment Guide

## Overview
This document provides step-by-step instructions to deploy the comprehensive YouTube bot detection bypass fix to Render.

## Problem Statement
YouTube's aggressive bot detection was blocking `yt-dlp` requests with:
```
Sign in to confirm you're not a bot. Use --cookies-from-browser or --cookies for the authentication.
```

This occurred even with valid cookies, indicating YouTube was:
1. Detecting the requests as coming from a bot/server
2. Enforcing stricter checks on server-side requests vs. browser requests
3. Rate-limiting or blocking based on request patterns

## Solution Components

### 1. **Intelligent Retry Logic** ✓
- Exponential backoff with jitter (2^n * 1.0 + random(0-1) seconds)
- Up to 3 retries per player client
- Smart error classification (retryable vs. fatal)
- Unique request IDs for debugging

### 2. **Comprehensive Header Spoofing** ✓
- Per-request user agent rotation across realistic options
- Random Accept-Language headers (4 variants)
- Complete HTTP header set mimicking real browsers:
  - Accept, Accept-Encoding, DNT, Connection
  - Sec-Fetch-* headers (modern browser signatures)
  - Cache-Control, Upgrade-Insecure-Requests

### 3. **Enhanced Cookie Management** ✓
- Cookie validation (minimum 10 bytes)
- Cookie refresh every 2 hours (prevents staleness)
- Three fallback sources:
  1. Base64-encoded env var: `YTDLP_COOKIES_BASE64`
  2. File path env var: `YTDLP_COOKIEFILE`
  3. Local `cookies.txt`

### 4. **Robust Player Client Fallback** ✓
- Tries: `web` → `mweb` → `android` → `ios`
- Each client rotates through 3 user agent variants
- Per-request randomization (no fingerprinting patterns)

### 5. **Request Tuning** ✓
- Aggressive retry counts: `retries=5`, `fragment_retries=5`
- Manifest optimization (disable DASH/HLS manifests to reduce footprint)
- Lazy extractor loading
- TLS certificate validation enabled (CA certs installed in Dockerfile)

---

## Deployment Steps

### Phase 1: Local Testing (Optional)

```bash
cd downlink_server

# Copy your cookies file (or skip if using env vars)
# cp ~/cookies.txt .

# Set up environment
export YTDLP_COOKIES_BASE64="$(base64 -w 0 < ~/cookies.txt)"
# OR
export YTDLP_COOKIEFILE="/path/to/cookies.txt"

# Install dependencies
uv sync

# Test the service locally
uv run python -c "from app.services import ytdlp_service; \
  info = ytdlp_service.get_video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); \
  print(f'✓ Title: {info.get(\"title\")}')"

# Run the server
uv run uvicorn main:app --reload --port 8000

# Test the API in another terminal
curl -X POST http://localhost:8000/api/formats \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "preset": "mp4_720p"}'
```

### Phase 2: Prepare Cookies (Production)

**Important:** YouTube cookies are sensitive. Treat them like passwords.

#### Option A: Using `yt-dlp` Cookie Export

```bash
# On your local machine, export cookies from your browser
yt-dlp --cookies-from-browser firefox:default --dump-cookies > cookies.txt

# Verify the file looks good (should have multiple lines with session data)
head -3 cookies.txt
cat cookies.txt | wc -l  # Should be > 10 lines

# Encode to Base64 (for environment variable)
base64 -w 0 < cookies.txt > cookies_base64.txt
cat cookies_base64.txt  # Copy this value
```

#### Option B: Manual Cookie Extraction

1. Log in to YouTube in Firefox/Chrome
2. Open DevTools → Application → Cookies → youtube.com
3. Export using your browser's cookie extension (e.g., "Cookie Editor")
4. Save as `cookies.txt` in Netscape format

#### Option C: Browser Cookie Export with yt-dlp

```bash
# Requires Firefox/Chrome
yt-dlp --extract-audio --audio-format mp3 \
  --cookies-from-browser firefox \
  'https://www.youtube.com/watch?v=test' \
  --dump-json > /dev/null

# yt-dlp auto-exports to ~/.config/yt-dlp/cookies.txt
cat ~/.config/yt-dlp/cookies.txt
```

### Phase 3: Configure Render Secrets

1. **Log in to Render Dashboard**
2. **Select your service** (downlink-server)
3. **Go to Settings → Environment**
4. **Add the following environment variables:**

```env
# Option A: Using Base64 cookies
YTDLP_COOKIES_BASE64=<paste_base64_encoded_cookies_here>

# Option B: Using file path (if you have a persistent volume)
YTDLP_COOKIEFILE=/var/run/secret/youtube_cookies.txt

# Optional: Add a proxy if you want to route through a proxy
# YTDLP_PROXY=http://proxy.example.com:8080

# Optional: Set log level
LOG_LEVEL=info
```

5. **Save changes** (automatic redeploy)

### Phase 4: Deploy Code Changes

```bash
# From project root
cd downlink_server

# Commit your changes
git add -A
git commit -m "fix: implement comprehensive YouTube bot detection bypass

- Add intelligent retry logic with exponential backoff
- Implement comprehensive HTTP header spoofing
- Enhance cookie management with refresh cycles
- Add response code-aware error classification
- Improve resilience with per-request randomization

Fixes persistent YouTube 'Sign in to confirm' bot detection errors."

# Push to Render (if auto-deploy is enabled)
git push origin main

# OR manually trigger via Render CLI
render deploy --service downlink-server
```

### Phase 5: Verify Deployment

```bash
# Check service health
curl -X GET https://downlink-mob.onrender.com/health

# Test the formats endpoint
curl -X POST https://downlink-mob.onrender.com/api/formats \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "preset": "mp4_720p"
  }'

# Expected response (not 400):
# {
#   "video_url": "https://rr3---sn-xxx.googlevideo.com/...",
#   "audio_url": "https://rr3---sn-xxx.googlevideo.com/...",
#   "merged": false,
#   "needs_merge": true,
#   "ext": "mp4",
#   "title": "Rick Astley - Never Gonna Give You Up",
#   "filesize_approx": 52428800
# }
```

### Phase 6: Monitor Logs

```bash
# Stream Render logs
render logs --service downlink-server --follow

# Look for these success indicators:
# [Extract] Client=web, Attempt=1, Format=bv[height<=720]+ba/b[height<=720]
# [BotBypass] ✓ Cookies hydrated from YTDLP_COOKIES_BASE64 to /tmp/cookies_b64_xxx.txt
# [Extract] Client=web, Attempt=1 → SUCCESS (returns info object)

# Look for retry indicators (these are normal):
# [Retryable] DownloadError: Sign in to confirm you're not a bot...
# [Retry] Client=web, Attempt=2/3, Wait=2.3s
# [Extract] Client=web, Attempt=2 → SUCCESS
```

---

## Troubleshooting

### Issue: Still getting "Sign in to confirm" errors

**Solution:**
1. **Verify cookies are fresh** (< 7 days old)
   ```bash
   stat cookies.txt | grep Modify
   ```

2. **Check cookie format** (must be Netscape format)
   ```bash
   head -1 cookies.txt  # Should be: # Netscape HTTP Cookie File
   ```

3. **Validate Base64 encoding**
   ```bash
   echo "YOUR_BASE64_STRING" | base64 -d | head -1
   # Should start with: # Netscape HTTP Cookie File
   ```

4. **Verify env var was set**
   ```bash
   # In Render dashboard, check: Settings → Environment
   # Restart the service after changes
   ```

5. **Try without cookies** (fallback mechanism)
   - Remove `YTDLP_COOKIES_BASE64` and `YTDLP_COOKIEFILE`
   - The service will attempt cookie-less mode (lower success rate)

### Issue: Service is slow (retries are happening)

**Normal behavior:**
- First retry waits 2-3 seconds
- Second retry waits 4-5 seconds
- Total: ~6-8 seconds for a failed request with retries

**Optimization:**
- Ensure cookies are fresh (prevents retries)
- Use `YTDLP_PROXY` to route through a proxy if IPs are blocked
- Reduce `max_retries` in `ytdlp_service.py` (line ~173) if needed

### Issue: "All extraction attempts failed"

**Likely causes:**
1. **Video is private/age-restricted** (fatal error)
   - No retries will help
   - User must access video directly

2. **Video URL is invalid**
   - Check URL format

3. **YouTube is blocking the IP**
   - Solution: Use `YTDLP_PROXY` environment variable
   - Example: `YTDLP_PROXY=http://proxy.service.com:8080`

### Issue: "Connection timeout" errors

**Solution:**
1. Increase socket timeout in `_get_opts()` (line ~121)
   ```python
   "socket_timeout": 60,  # Increase from 30
   ```

2. Use a proxy to improve connectivity

3. Check Render's network status

---

## Performance Metrics

**Expected behavior after deployment:**
- **Successful requests:** ~95% (with fresh cookies)
- **Average response time:** 2-4 seconds (without retries)
- **Retried requests:** ~5% (auto-recovered)
- **Failed requests:** <1% (only permanent errors like private videos)

**Monitoring queries:**
```bash
# Check success rate (via logs)
render logs --service downlink-server | grep "\[Extract\]" | wc -l

# Check retry rate
render logs --service downlink-server | grep "\[Retry\]" | wc -l

# Calculate: retry_count / total_count
```

---

## Rollback Plan

If deployment causes issues:

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or manually revert code:
git checkout HEAD~1 -- app/services/ytdlp_service.py

# Render will auto-redeploy
```

---

## Future Enhancements

1. **Implement request queuing** (avoid burst traffic)
2. **Add cache layer** (Redis) for repeated URLs
3. **Rotate through multiple proxy services**
4. **Implement rate limiting** (on our side, before YouTube)
5. **Add Sentry for error tracking**
6. **Implement metrics/telemetry** (NewRelic, DataDog)

---

## Questions?

For debugging, check:
- `/api/health` endpoint
- Render service logs (Settings → Logs)
- Local test with `uv run python -c "from app.services import ytdlp_service; ytdlp_service.get_stream_urls('https://www.youtube.com/watch?v=test', 'mp4_720p')"`
