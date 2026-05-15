# Downlink API Configuration

## Development Setup

### For Simulator Testing
If you're testing on iOS Simulator, `localhost` works fine:
```json
{
  "API_URL": "http://localhost:8000"
}
```

### For Physical Device Testing
If you're testing on a physical iPhone, you need to use your machine's local IP address:

1. Find your machine's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Create `src/env.json`:
   ```json
   {
     "API_URL": "http://192.168.x.x:8000"
   }
   ```
   Replace `192.168.x.x` with your actual machine IP

3. Make sure your backend is running:
   ```bash
   cd downlink_server
   uv run uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### For Production (Render Deployment)
The app automatically uses `https://downlink-mob.onrender.com` when built for production. Make sure:
1. Your backend is deployed on Render
2. The service is running and healthy
3. CORS is properly configured in your backend

## Troubleshooting

### "Failed: Network request failed"
- Check that your backend is running
- Verify the API_URL is correct and accessible from your device
- Check firewall settings if on physical device
- Look at the error message in the app for the API_URL being used

### Cannot reach localhost from physical device
- Use your machine's actual IP address instead
- Ensure both device and machine are on the same network
- Check that port 8000 is not blocked by firewall

### CORS errors
- Backend CORS is already set to allow all origins (configured in `app/__init__.py`)
- If you're getting CORS errors, check your backend logs
