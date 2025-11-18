/**
 * Firebase Configuration
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { Firestore, enableIndexedDbPersistence, initializeFirestore } from 'firebase/firestore';

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

/**
 * Initialize Firebase with configuration
 */
export function initializeFirebase(config: FirebaseConfig): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  console.log('Initializing Firebase with config:', {
    projectId: config.projectId,
    authDomain: config.authDomain
  });

  firebaseApp = initializeApp(config);
  console.log('Firebase app initialized successfully');
  return firebaseApp;
}

/**
 * Get Firestore instance
 */
export function getDb(): Firestore {
  if (!firestoreDb) {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }

    console.log('Initializing Firestore with experimentalForceLongPolling...');

    // Initialize Firestore with settings that help with connectivity
    firestoreDb = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true, // Helps with connectivity issues
      experimentalAutoDetectLongPolling: false,
    });

    console.log('Firestore initialized successfully');

    // Try to enable offline persistence (optional, will fail silently if not supported)
    enableIndexedDbPersistence(firestoreDb).catch((err) => {
      console.warn('IndexedDB persistence not enabled:', err.code);
    });
  }
  return firestoreDb;
}

/**
 * Get Firebase app instance
 */
export function getApp(): FirebaseApp {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return firebaseApp;
}
