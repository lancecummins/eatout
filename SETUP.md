# EatOut Setup Guide

Complete guide for setting up Firebase and Google Places API (New).

## Prerequisites

- Node.js 18+
- pnpm 8+
- Google Cloud account
- Firebase account

## Step 1: Install Dependencies

```bash
cd /Users/lancecummins/Coding/eatout
pnpm install
```

## Step 2: Set Up Firebase

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name (e.g., "eatout-app")
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Get Firebase Configuration

1. In your Firebase project, click the **gear icon** → **Project settings**
2. Scroll down to **"Your apps"**
3. Click the **Web icon** (`</>`)
4. Register app (name: "EatOut Web")
5. Copy the config object values

### Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose a location (e.g., `us-central`)
5. Click **"Enable"**

**Security Note:** Test mode allows all reads/writes. For production, update security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if true;
    }
    match /responses/{responseId} {
      allow read, write: if true;
    }
  }
}
```

## Step 3: Set Up Google Places API (New)

### Enable Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project (or create a new one)
3. Go to **APIs & Services** → **Library**
4. Search for **"Places API (New)"** or **"Places API"**
5. Click on it and click **"Enable"**

### Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **API key**
3. Copy the API key
4. Click **"Edit API key"** to restrict it:
   - **Application restrictions**:
     - For development: None (or HTTP referrers with `localhost:3000`)
     - For production: HTTP referrers (add your domain)
   - **API restrictions**:
     - Select **"Restrict key"**
     - Check **"Places API (New)"**
5. Click **"Save"**

### Important: Use Places API (New)

Make sure you're using the **new version** of Places API:
- ✅ **Places API (New)** - Modern API with better features
- ❌ **Places API** - Legacy version (don't use this)

The new API endpoint is: `https://places.googleapis.com/v1/`

## Step 4: Configure Environment Variables

Create `.env` file in `packages/web/`:

```bash
cp packages/web/.env.example packages/web/.env
```

Edit `packages/web/.env` with your values:

```env
# Firebase Configuration (from Step 2)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Google Places API (New) - from Step 3
VITE_GOOGLE_PLACES_API_KEY=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

## Step 5: Run the App

```bash
pnpm dev:web
```

The app should open at `http://localhost:3000`

## Troubleshooting

### "Places API error: 403"
- Check that Places API (New) is enabled in Google Cloud Console
- Verify your API key is correct in `.env`
- Check API key restrictions (allow localhost for development)

### "Firebase not initialized"
- Verify all Firebase config values are in `.env`
- Restart the dev server after editing `.env`
- Check for typos in variable names (must start with `VITE_`)

### "No restaurants found"
- Make sure you allowed location access in browser
- Verify you're in an area with restaurants nearby
- Check browser console for API errors
- Try increasing the search radius

### "CORS errors"
- The new Places API should handle CORS automatically
- If issues persist, check your API key restrictions
- For local development, API key restrictions should be set to "None" or allow `localhost`

## API Costs

### Google Places API (New) Pricing

Free tier (as of 2024):
- **Nearby Search**: $32 per 1000 requests (first $200/month free)
- **Place Details**: $17 per 1000 requests (first $200/month free)
- **Place Photos**: $7 per 1000 requests (first $200/month free)

The free tier covers ~6,250 searches per month.

### Firebase Pricing

Free tier (Spark plan):
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Hosting**: 10 GB storage, 360 MB/day transfer

For typical use, this should cover development and small production use.

## Next Steps

- Test creating a session
- Test joining from another browser/device
- Test eliminating cuisine types
- View recommendations

## Production Deployment

When deploying to production:

1. **Update Firebase Security Rules** (currently in test mode)
2. **Restrict API Keys** to your production domain
3. **Set up Firebase Hosting** for the web app
4. **Configure environment variables** in your hosting platform
5. **Set up session cleanup** (Cloud Functions to delete expired sessions)

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review browser console for errors
- Check Firebase Console for database issues
- Verify API quotas in Google Cloud Console
