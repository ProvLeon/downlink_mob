# CRITICAL UPDATE: Player Extraction Failure Fix

## New Error: "Failed to extract any player response"

This is a **different beast** than the "Sign in to confirm" bot detection error.

### What It Means
```
Failed to extract any player response
```

YouTube's player JavaScript/configuration couldn't be fetched or parsed. This can happen because:

1. **YouTube changed their player API** (happens every few weeks)
2. **Render's IP is completely blocked** (IP-level ban, not bot detection)
3. **The video has special restrictions** (region-locked, requires auth, etc.)
4. **Player signature validation failed** (signature mismatch)

### The Fix: Player Extraction Fallback Strategies

I've implemented **3 extraction strategies** that attempt sequentially:

#### Strategy 1: OAuth Mode (FORCE AUTH)
```python
use_oauth=True
# Forces yt-dlp to use OAuth token extraction instead of player signature
# Bypasses JavaScript player requirement
```

#### Strategy 2: Signature Timestamp Mode (NATIVE SIGNATURES)
```python
use_sig_timestamp=True
# Forces native signature extraction (simpler, older method)
# Useful when modern player detection fails
```

#### Strategy 3: Standard Extraction with Fallback
```python
# If OAuth and sig fail, fall back to basic format listing
# May return lower quality formats but still functional
```

---

## What Changed in Code

### `ytdlp_service.py` - Key additions:

1. **Enhanced error classification** (line ~285)
   - Added "failed to extract any player response" as retryable
   - Now distinguishes player extraction errors from fatal ones

2. **Player extraction fallback logic** (line ~393-440)
   - When player extraction fails, try OAuth mode first
   - If OAuth fails, try signatureTimestamp mode
   - Log results for debugging

3. **Advanced extraction parameters** (line ~180-255)
   - `use_oauth` flag: Force OAuth token extraction
   - `use_sig_timestamp` flag: Force native signature extraction
   - Both parameters properly documented

---

## How It Works (Flow Chart)

```
Request for video URL
  ↓
Try Player Client 1 (web) with standard extraction
  ├─→ Success? Return result ✓
  ├─→ Player extraction failed?
  │    ├─→ Try OAuth mode → Success? Return ✓
  │    ├─→ Try Signature Timestamp mode → Success? Return ✓
  │    └─→ Move to next player client
  └─→ Retryable error? Retry with backoff
  
Try Player Client 2 (mweb), 3 (android), 4 (ios)
  [Same fallback logic for each]
  
If all fail → Raise last error (user gets 400 response)
```

---

## Deployment (No Changes Needed!)

The fix is **already in the code** I pushed. Just:

1. **Ensure cookies are fresh** (< 7 days)
2. **Push the code:** Already done ✓
3. **Set env var:** Already done (if you set `YTDLP_COOKIES_BASE64`) ✓
4. **Restart service:** Render auto-redeploys ✓

---

## Testing Locally

```bash
cd downlink_server

# Export cookies first
export YTDLP_COOKIES_BASE64="$(base64 -w 0 < cookies.txt)"

# Run diagnostic
uv run python test_extraction.py

# Expected output:
# [Emergency Test] YouTube Extraction Diagnostics
# [Env] YTDLP_COOKIES_BASE64: SET
# [Env] YTDLP_COOKIEFILE: NOT SET
# [Env] YTDLP_PROXY: NOT SET
# 
# ============================================================
# Testing: https://www.youtube.com/watch?v=dQw4w9WgXcQ
# ============================================================
# 
# [1] Testing get_video_info()...
# ✓ SUCCESS: Rick Astley - Never Gonna Give You Up
# 
# [2] Testing get_stream_urls() with mp4_720p...
# ✓ SUCCESS:
#    - video_url: https://rr3---...
#    - audio_url: https://rr3---...
#    - needs_merge: true
```

---

## Logs to Look For (Good Signs)

```
[PlayerExtraction] Attempting fallback strategies for web
[PlayerExtraction] ✓ SUCCESS with OAuth strategy

# OR

[PlayerExtraction] Attempting fallback strategies for web
[PlayerExtraction] OAuth failed: ...
[PlayerExtraction] ✓ SUCCESS with signatureTimestamp strategy

# OR

[Extract] Client=web, Attempt=1... SUCCESS
# (Standard extraction worked without needing fallbacks)
```

---

## Logs to Look For (Bad Signs)

```
[PlayerExtraction] Attempting fallback strategies for web
[PlayerExtraction] OAuth failed: ...
[PlayerExtraction] signatureTimestamp failed: ...
[Retryable] DownloadError: Failed to extract any player response
[Retry] Client=web, Attempt=2/3...

# This means:
# 1. Standard extraction failed
# 2. OAuth fallback failed
# 3. Signature fallback failed
# 4. Retrying with backoff...

# If this persists across all clients (web, mweb, android, ios):
# → Render's IP is likely blocked by YouTube
# → Solution: Use YTDLP_PROXY to rotate IPs
```

---

## If It Still Doesn't Work

### Option 1: Use a Proxy (IP Rotation)
```bash
# Add to Render Environment:
YTDLP_PROXY=http://proxy.service.com:8080

# Or use a free proxy service (careful with privacy!)
# Example: https://www.proxy-list.download/
```

### Option 2: Refresh Cookies (Likely Stale)
```bash
# Export fresh cookies from your browser
yt-dlp --cookies-from-browser firefox:default --dump-cookies > cookies.txt

# Re-encode and update Render env var
base64 -w 0 < cookies.txt | pbcopy

# Paste into: Render Dashboard → downlink-server → Settings → Environment
```

### Option 3: Check if Video is Accessible
```bash
# Test if yt-dlp works locally on the video
yt-dlp --dump-json "https://www.youtube.com/watch?v=wwimSvG-S3E" > /dev/null

# If this fails, the video may be:
# - Region-blocked
# - Age-restricted
# - Requires authentication
# - Removed from YouTube
```

### Option 4: Nuclear Option - Force a yt-dlp Update
```bash
# Update yt-dlp to latest
uv pip install --upgrade yt-dlp

# Push to Render
git add -A
git commit -m "chore: upgrade yt-dlp to latest"
git push origin main
```

---

## Summary

| Error | Root Cause | Fix |
|-------|-----------|-----|
| "Sign in to confirm" | Bot detection | Fresh cookies + retries |
| "Failed to extract any player response" | Player API changed or IP blocked | OAuth/Sig strategies + proxy |
| Still failing after all retries | IP-level block or video restricted | Use proxy or check video access |

The new fallback system gives the server **3 chances** to extract video info before giving up. This should handle the majority of YouTube API quirks.

**Keep cookies fresh. Use proxies if needed. Monitor logs.**
