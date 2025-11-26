# Google OAuth Troubleshooting Guide

## Error: "Can't continue with google.com - Something went wrong"

This error typically occurs due to configuration issues. Here's how to fix it:

### 1. Check Google Cloud Console Configuration

**Verify these settings in your Google Cloud Console:**

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Navigate to**: APIs & Services → Credentials
3. **Find your OAuth 2.0 Client ID**: `307710170076-rkgkukpc0gfrb5vp31dk4qpl0i403m0q.apps.googleusercontent.com`

### 2. Required JavaScript Origins

**Add these EXACT URLs to "Authorized JavaScript origins":**
```
http://localhost:8080
http://127.0.0.1:8080
```

**⚠️ Important Notes:**
- Use `http://` NOT `https://` for localhost
- No trailing slashes (`/`)
- Port must match exactly (8080)

### 3. Required Redirect URIs

**Add these EXACT URLs to "Authorized redirect URIs":**
```
http://localhost:8080
http://127.0.0.1:8080
```

### 4. OAuth Consent Screen Setup

**Ensure your OAuth consent screen is configured:**

1. **Go to**: APIs & Services → OAuth consent screen
2. **Set User Type**: External (for testing)
3. **Add Test Users**: Add your Gmail address to test users list
4. **Scopes Required**:
   - `openid`
   - `email`
   - `profile`

### 5. Common Issues & Solutions

**Issue**: "App isn't verified"
- **Solution**: Add your Gmail to test users in OAuth consent screen

**Issue**: "Origin not allowed"
- **Solution**: Double-check JavaScript origins match exactly

**Issue**: "Popup blocked"
- **Solution**: Allow popups for localhost:8080

**Issue**: "This app is blocked"
- **Solution**: Set OAuth consent screen to "External" and add test users

### 6. Browser-Specific Issues

**Chrome/Edge:**
- Clear cookies for accounts.google.com
- Disable popup blockers for localhost

**Firefox:**
- Enable third-party cookies temporarily
- Check Enhanced Tracking Protection settings

### 7. Testing Steps

1. **Clear browser cache and cookies**
2. **Visit**: `http://localhost:8080/google-test`
3. **Open browser console** (F12)
4. **Click "Continue with Google"**
5. **Check console for specific error messages**

### 8. Verification Checklist

- [ ] Client ID is correct in both frontend and backend
- [ ] JavaScript origins include `http://localhost:8080`
- [ ] OAuth consent screen is configured
- [ ] Test users added (your Gmail address)
- [ ] Popups are allowed
- [ ] No HTTPS mixed content warnings

### 9. Alternative Testing

If issues persist, try:
1. **Different browser** (Chrome/Edge/Firefox)
2. **Incognito/Private mode**
3. **Different Google account**
4. **Clear all Google cookies**

### 10. Debug Information

**Current Configuration:**
- Client ID: `307710170076-rkgkukpc0gfrb5vp31dk4qpl0i403m0q.apps.googleusercontent.com`
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4000`

**Test these URLs work:**
- Frontend: http://localhost:8080
- Backend Health: http://localhost:4000/api/health
- Debug Page: http://localhost:8080/google-test