/**
 * Firebase initialization for web app
 */

import { initializeFirebase, initializePlacesApi } from '@eatout/shared';

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

initializeFirebase(firebaseConfig);

// Initialize Google Places API
const placesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
initializePlacesApi({ apiKey: placesApiKey });

export { firebaseConfig };
