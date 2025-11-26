# Local Development Quick Start

## Start Both Servers

### Terminal 1 - Backend Server
```powershell
cd E:\College\2nd\FEDF\ad-a-venue-main\ad-a-venue-main
cmd /c 'set "PATH=E:\College\2nd\FEDF\ad-a-venue-main\ad-a-venue-main\node-v20.18.0-win-x64\node-v20.18.0-win-x64;%PATH%" && cd /d E:\College\2nd\FEDF\ad-a-venue-main\ad-a-venue-main\server && node index.js'
```

### Terminal 2 - Frontend Server
```powershell
cd E:\College\2nd\FEDF\ad-a-venue-main\ad-a-venue-main
cmd /c 'set "PATH=E:\College\2nd\FEDF\ad-a-venue-main\ad-a-venue-main\node-v20.18.0-win-x64\node-v20.18.0-win-x64;%PATH%" && npm run dev'
```

## Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/api/health

## Recent Fixes Applied

### ✅ Google Authentication Error
**Issue:** `Cannot read properties of undefined (reading 'role')`
**Fix:** Added validation to check if user data exists before accessing properties

### ✅ Connection Error on Login
**Issue:** "Failed to connect to server"
**Fix:** Improved error handling to distinguish between network errors and API errors

### ✅ Render.yaml Configuration
**Issue:** Frontend service type was incorrect
**Fix:** Changed from `type: web` to `type: static` for static site deployment

## Testing Checklist

- [ ] Backend health endpoint responds
- [ ] User registration works
- [ ] User login works
- [ ] Organizer login works
- [ ] Google sign-in works (after whitelisting origin)
- [ ] Event browsing works
- [ ] Booking flow works

## Common Issues

### "Connection Error" when logging in
- Ensure backend server is running on port 4000
- Check `http://localhost:4000/api/health` responds with `{"status":"ok"}`
- Verify MongoDB connection in backend terminal logs

### Google Sign-In Errors
1. **origin_mismatch**: Add `http://localhost:5173` to Google Cloud Console authorized origins
2. **"Cannot read properties of undefined"**: Fixed in latest commit
3. **COOP policy warnings**: These are browser warnings and don't block functionality

### Port Conflicts
```powershell
# Check what's running on ports
netstat -ano | Select-String -Pattern "4000|5173"

# Kill process by PID
Stop-Process -Id <PID> -Force
```

## Environment Variables

### Backend (server/.env)
```env
MONGODB_URI=mongodb+srv://nikhilg7069_db_user:7069@eventmanagement.i7hb5nv.mongodb.net/eventhub?appName=eventmanagement
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=330432503289-e4ufv921aq1jdh7lponqfi1jo8o5bs5u.apps.googleusercontent.com
NODE_ENV=development
```

### Frontend (.env - optional for local dev)
```env
VITE_API_BASE_URL=http://localhost:4000
```
*Note: If not set, defaults to `http://localhost:4000` automatically*

## Deployment Status

Repository: https://github.com/nikhil07g/EventManagementSystem
- ✅ Code pushed to GitHub
- ✅ Render.yaml configured
- ✅ RENDER_DEPLOYMENT.md guide created
- ⏳ Ready for Render.com deployment

## Next Steps for Render Deployment

1. Go to [Render.com](https://render.com)
2. Follow steps in `RENDER_DEPLOYMENT.md`
3. Deploy backend first, note the URL
4. Deploy frontend with backend URL as env var
5. Update Google OAuth origins with Render URLs
