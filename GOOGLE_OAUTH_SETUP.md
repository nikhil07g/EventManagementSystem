# Google OAuth Setup Instructions

## 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Choose "Web application"
7. Add authorized JavaScript origins (these must match the exact protocol + host + port you run the frontend on):
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - Add any other origin you actually use (e.g. `https://localhost:5173` if you enable HTTPS, or the LAN IP shown by Vite such as `http://192.168.0.xxx:5173`).
8. Add authorized redirect URIs (only required if you later switch to the OAuth redirect flow; safe to pre-fill so Google does not block you):
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - Add production URLs when you deploy (for example `https://yourdomain.com`).
9. Copy the Client ID

## 2. Update Environment Variables

Replace the placeholder in the following files:

### Backend (.env file):
```
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

### Frontend (GoogleSignIn.tsx):
```typescript
client_id: 'your-actual-google-client-id-here',
```

## 3. Example Client ID Format
```
123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

## 4. Test the Integration

1. Start the backend server: `npm start` or `node index.js`
2. Start the frontend: `npm run dev`
3. Try Google Sign-In on both User and Organizer portals

## 5. Important Notes

- The same Client ID can be used for both user and organizer portals
- Make sure the domains match exactly in Google Console
- For production, add your actual domain to authorized origins