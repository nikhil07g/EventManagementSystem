# Render.com Deployment Guide

## Prerequisites
✅ GitHub repository: https://github.com/nikhil07g/EventManagementSystem
✅ MongoDB Atlas database
✅ Google OAuth Client ID (for Google sign-in)
✅ Render.com account

---

## Part 1: Backend API Deployment

### Step 1: Create Web Service
1. Log in to [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select **nikhil07g/EventManagementSystem**

### Step 2: Configure Backend Service
**Basic Settings:**
- **Name:** `event-management-api` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** `server`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Node Version:** `20.18.0`
- **Auto-Deploy:** Yes (recommended)

### Step 3: Add Environment Variables
Click **"Environment"** tab and add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | `mongodb+srv://username:password@...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-random-secret-key-here` | Generate a strong random string (32+ chars) |
| `GOOGLE_CLIENT_ID` | `your-client-id.apps.googleusercontent.com` | From Google Cloud Console |
| `PORT` | `4000` | Backend port |
| `NODE_ENV` | `production` | Environment mode |
| `CORS_ALLOWED_ORIGINS` | `https://event-management-frontend.onrender.com` | **IMPORTANT:** Add your frontend URL here for CORS |

**Generate JWT Secret:**
```bash
# Run in terminal to generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://event-management-api.onrender.com`
4. Test health endpoint: `https://event-management-api.onrender.com/api/health`

**⚠️ IMPORTANT:** You'll need to update `CORS_ALLOWED_ORIGINS` after deploying the frontend (see Part 2, Step 5)

---

## Part 2: Frontend Static Site Deployment

### Step 1: Create Static Site
1. Click **"New +"** → **"Static Site"**
2. Select **nikhil07g/EventManagementSystem** repository

### Step 2: Configure Frontend Service
**Basic Settings:**
- **Name:** `event-management-frontend` (or your preferred name)
- **Region:** Same as backend
- **Branch:** `main`
- **Root Directory:** (leave empty)
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

**Advanced Settings:**
- **Node Version:** `20.18.0`
- **Auto-Deploy:** Yes

### Step 3: Add Environment Variables
Click **"Environment"** tab:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://event-management-api.onrender.com` |

### Step 4: Deploy Frontend
1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Note your frontend URL: `https://event-management-frontend.onrender.com`

### Step 5: Update Backend CORS Settings
**CRITICAL STEP:** Now that you have your frontend URL, go back to the backend service:

1. Go to your backend service (`event-management-api`)
2. Click **"Environment"** tab
3. Find `CORS_ALLOWED_ORIGINS` variable
4. Update the value to your actual frontend URL: `https://your-frontend-name.onrender.com`
5. Click **"Save Changes"**
6. Backend will automatically redeploy (takes 1-2 minutes)

**Example:**
```
CORS_ALLOWED_ORIGINS=https://event-management-frontend.onrender.com
```

**For multiple origins (separated by commas):**
```
CORS_ALLOWED_ORIGINS=https://event-management-frontend.onrender.com,https://www.yourdomain.com
```

---

## Part 3: Post-Deployment Configuration

### Configure MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Select **"Allow access from anywhere"** (0.0.0.0/0)
   - Or add Render's IP ranges if you prefer stricter security
5. Click **"Confirm"**

### Configure Google OAuth (if using Google sign-in)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Select your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `https://event-management-frontend.onrender.com`
   - Your custom domain (if applicable)
5. Under **Authorized redirect URIs**, add:
   - `https://event-management-frontend.onrender.com/auth/callback`
6. Click **"Save"**

### Update CORS (if needed)
If you're using a custom domain or need to allow specific origins:
1. Go to backend service on Render
2. Add environment variable: `CORS_ALLOWED_ORIGINS`
3. Value: `https://yourdomain.com,https://anotherdomain.com`
4. Service will auto-redeploy

---

## Part 4: Testing Your Deployment

### Backend Tests
```bash
# Health check
curl https://event-management-api.onrender.com/api/health

# Test registration (replace URL)
curl -X POST https://event-management-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'

# Test login
curl -X POST https://event-management-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Frontend Tests
1. Open `https://event-management-frontend.onrender.com`
2. Test user registration
3. Test login
4. Browse events (Movies, Sports, Concerts, Family)
5. Test booking flow
6. Test Google sign-in (if configured)

---

## Part 5: Custom Domain (Optional)

### For Frontend
1. In Render dashboard, go to frontend service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain (e.g., `www.yourdomain.com`)
4. Update your DNS records as instructed
5. Wait for SSL certificate provisioning (automatic)

### For Backend (if using subdomain)
1. Go to backend service
2. Click **"Settings"** → **"Custom Domain"**
3. Add subdomain (e.g., `api.yourdomain.com`)
4. Update DNS records
5. Update frontend `VITE_API_BASE_URL` to new backend URL

### Update Environment Variables After Custom Domain
1. **Frontend:** Update `VITE_API_BASE_URL` to `https://api.yourdomain.com`
2. **Backend:** Update `CORS_ALLOWED_ORIGINS` to include `https://www.yourdomain.com`
3. **Google OAuth:** Add custom domains to authorized origins

---

## Troubleshooting

### Backend Not Starting
- Check logs in Render dashboard
- Verify `MONGODB_URI` is correct
- Ensure `PORT` is set to `4000`
- Check Node version is `20.18.0`

### Frontend Can't Connect to Backend
- Verify `VITE_API_BASE_URL` matches backend URL exactly
- Check browser console for CORS errors
- Ensure backend is deployed and healthy

### CORS Errors
- Add frontend URL to `CORS_ALLOWED_ORIGINS` in backend
- Check Google OAuth origins if using Google sign-in
- Verify protocol (http vs https) matches

### MongoDB Connection Errors
- Verify connection string is correct
- Check Network Access in MongoDB Atlas
- Ensure database user has correct permissions

### Google Sign-In Not Working
- Verify Google OAuth client ID in backend env vars
- Check authorized origins in Google Cloud Console
- Ensure redirect URIs are configured correctly

---

## Important Notes

### Free Tier Limitations
- **Render Free Tier:** Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading for production use

### Environment Variables Security
- Never commit `.env` files to Git
- Use Render's environment variable manager
- Rotate secrets periodically

### Monitoring
- Check Render logs for errors
- Set up MongoDB Atlas monitoring
- Consider adding error tracking (Sentry, etc.)

---

## Need Help?

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **GitHub Repo:** https://github.com/nikhil07g/EventManagementSystem

---

**Your deployment is complete! 🎉**

Access your app at: `https://event-management-frontend.onrender.com`
