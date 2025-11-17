/**
 * Firebase Configuration
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

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

  firebaseApp = initializeApp(config);
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
    firestoreDb = getFirestore(firebaseApp);
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
