# FFmpeg Merge Endpoint - Deployment Checklist

## ✅ Implementation Complete

### Code Files Created

- [x] `downlink_server/app/routers/merge.py` - FastAPI endpoint (133 lines)
- [x] `downlink_server/app/services/merge_service.py` - Merge service (205 lines)
- [x] `downlink_server/app/__init__.py` - Updated app initialization
- [x] `downlink_server/test_merge.py` - Test suite (209 lines)
- [x] `downlink_server/quickstart.py` - Quick start script (222 lines)

### Documentation Files

- [x] `downlink_server/MERGE_ENDPOINT.md` - Complete API documentation
- [x] `downlink_server/IMPLEMENTATION_SUMMARY.md` - Implementation details
- [x] `downlink_server/DEPLOYMENT_CHECKLIST.md` - This file

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment Verification

```bash
# Check syntax
cd downlink_server
python -m py_compile app/routers/merge.py app/services/merge_service.py app/__init__.py
echo "✓ All Python files compile"

# Check dependencies are installed
uv sync
echo "✓ Dependencies installed"

# Run tests
uv run pytest test_merge.py -v
echo "✓ All tests passed"
```

### Step 2: Local Testing

```bash
# Start the development server
uv run uvicorn main:app --reload

# In another terminal, test the endpoint
curl -X POST http://localhost:8000/api/merge \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/video.mp4",
    "audio_url": "https://example.com/audio.m4a",
    "ext": "mp4"
  }'
```

### Step 3: Docker Deployment

```bash
# Build the Docker image
docker build -t downlink-api:latest .

# Verify FFmpeg is included
docker run downlink-api:latest ffmpeg -version

# Run the container
docker run -p 8000:8000 downlink-api:latest
```

### Step 4: Verify Endpoint Registration

```bash
# Check that the endpoint is in the OpenAPI schema
curl http://localhost:8000/openapi.json | grep "/api/merge"

# Visit the interactive docs
# http://localhost:8000/docs
# Look for "POST /api/merge" under "Merge" section
```

---

## 📋 Pre-Production Checklist

### Security
- [ ] Review CORS configuration in `app/__init__.py`
  - Current: `allow_origins=["*"]` (permissive for dev)
  - Recommended: Change to specific domain(s) for production
  
- [ ] Add rate limiting middleware
  - Example: `slowapi` or `fastapi-limiter2`
  
- [ ] Add authentication if needed
  - Example: JWT tokens, API keys
  
- [ ] Review error messages
  - Current: Generic error messages (good)
  - Verify no sensitive info is leaked

### Performance
- [ ] Test with actual stream URLs
- [ ] Monitor memory usage during merges
- [ ] Verify temp directory cleanup
- [ ] Test concurrent merge operations
- [ ] Monitor disk space during operations

### Infrastructure
- [ ] Ensure FFmpeg is installed in production
  - Docker image includes it (verified)
  
- [ ] Monitor temp directory (`/tmp/downlink_merge/`)
- [ ] Set up log aggregation
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up performance monitoring

### Operational
- [ ] Document rollback procedure
- [ ] Set up monitoring alerts
- [ ] Create runbook for common issues
- [ ] Test disaster recovery
- [ ] Set up backup/archival of merged files (if needed)

---

## 📊 Configuration Recommendations

### For Production Deployment

Update `app/services/merge_service.py`:

```python
# Current settings (suitable for most cases)
DOWNLOAD_TIMEOUT = 300      # 5 minutes
MERGE_TIMEOUT = 600         # 10 minutes
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB

# For faster CDNs, consider reducing timeouts:
# DOWNLOAD_TIMEOUT = 180    # 3 minutes
# MERGE_TIMEOUT = 300       # 5 minutes

# For larger files, consider increasing limits:
# MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB
```

### Update CORS for Production

In `app/__init__.py`:

```python
# Current (development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Production recommendation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
```

---

## 🧪 Testing Checklist

### Unit Tests
- [x] Request validation tests
- [x] Format-specific tests
- [x] Error handling tests
- [x] Mock-based tests (no FFmpeg required)

### Integration Tests
- [ ] Test with real stream URLs (YouTube, etc.)
- [ ] Test with various video/audio formats
- [ ] Test with large files
- [ ] Test concurrent requests
- [ ] Test timeout scenarios
- [ ] Test error recovery

### Performance Tests
- [ ] Measure merge speed
- [ ] Measure memory usage
- [ ] Measure disk I/O
- [ ] Test with slow CDN connections
- [ ] Test with fast CDN connections

---

## 📈 Monitoring and Alerting

### Metrics to Monitor

1. **Request Rate**
   - Requests per minute
   - Concurrent active requests

2. **Success Rate**
   - Successful merges (200 status)
   - Failed requests (4xx/5xx)
   - Timeout errors

3. **Performance**
   - Average merge time
   - Download speed
   - P95/P99 latencies

4. **Resource Usage**
   - CPU usage
   - Memory usage
   - Disk space (temp directory)
   - Network bandwidth

### Alerts to Set Up

- [ ] Disk space < 1GB in temp directory
- [ ] Error rate > 5% (in 5-minute window)
- [ ] Average merge time > 5 minutes
- [ ] Memory usage > 80%
- [ ] CPU usage > 80%
- [ ] FFmpeg command not found (critical)

---

## 🔧 Troubleshooting Guide

### Common Issues

#### FFmpeg Not Found
```bash
# In Docker container
docker exec <container_id> which ffmpeg

# In local environment
which ffmpeg
which ffmpeg || brew install ffmpeg  # macOS
which ffmpeg || apt-get install ffmpeg  # Linux
```

#### Download Timeouts
- Increase `DOWNLOAD_TIMEOUT` in `merge_service.py`
- Check CDN connectivity
- Verify stream URLs are accessible

#### Merge Timeouts
- Increase `MERGE_TIMEOUT` in `merge_service.py`
- Check server resources (CPU, memory)
- Consider splitting large files

#### Temp Directory Issues
- Monitor disk space
- Check permissions on temp directory
- Manually cleanup: `rm -rf /tmp/downlink_merge/*`

#### Memory Issues
- Monitor peak memory usage
- Consider lowering chunk size (65KB)
- Increase server memory

---

## 📞 Support Resources

### Documentation
- `MERGE_ENDPOINT.md` - Complete API reference
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `README.md` - Project README

### Code References
- `app/routers/merge.py` - Endpoint implementation
- `app/services/merge_service.py` - Service implementation
- `test_merge.py` - Test examples

### External Resources
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

## ✅ Sign-Off

**Implementation Status:** ✅ COMPLETE

**Deployment Status:** ✅ READY FOR TESTING

**Production Status:** ⏳ PENDING VERIFICATION

### Pre-Production Tasks
- [ ] Local testing completed
- [ ] Docker image tested
- [ ] Performance tested
- [ ] Security reviewed
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Team trained

### Go-Live Tasks
- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Monitor metrics
- [ ] Deploy to production
- [ ] Monitor production metrics
- [ ] Set up on-call alerts

---

## 📝 Deployment Notes

**Date Deployed:** _______________

**Deployed By:** _______________

**Environment:** _______________

**Notes:**
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**For questions or issues, refer to MERGE_ENDPOINT.md or IMPLEMENTATION_SUMMARY.md**
