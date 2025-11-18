/**
 * Firestore operations for Sessions
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './config';
import { Session, Location, SessionStatus } from '../types';
import { generateJoinCode } from '../utils/joinCode';

const SESSIONS_COLLECTION = 'sessions';
const SESSION_DURATION_HOURS = 24; // Sessions expire after 24 hours

/**
 * Create a new session
 */
export async function createSession(
  adminId: string,
  location: Location
): Promise<Session> {
  console.log('createSession: Starting...');
  const db = getDb();
  console.log('createSession: Got Firestore DB instance');

  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_HOURS * 60 * 60 * 1000;

  // Generate unique join code
  let joinCode = generateJoinCode();
  console.log('createSession: Generated join code:', joinCode);
  let isUnique = false;

  // Ensure join code is unique
  while (!isUnique) {
    console.log('createSession: Checking if join code is unique...');
    const existingSession = await getSessionByJoinCode(joinCode);
    if (!existingSession) {
      isUnique = true;
      console.log('createSession: Join code is unique!');
    } else {
      console.log('createSession: Join code exists, generating new one...');
      joinCode = generateJoinCode();
    }
  }

  const sessionId = doc(collection(db, SESSIONS_COLLECTION)).id;
  console.log('createSession: Generated session ID:', sessionId);

  const session: Session = {
    id: sessionId,
    joinCode,
    adminId,
    createdAt: now,
    expiresAt,
    location,
    favoritedRestaurants: [],
    status: 'active',
  };

  console.log('createSession: Writing session to Firestore...');
  await setDoc(doc(db, SESSIONS_COLLECTION, sessionId), session);
  console.log('createSession: Session created successfully!');

  return session;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const db = getDb();
  const sessionDoc = await getDoc(doc(db, SESSIONS_COLLECTION, sessionId));

  if (!sessionDoc.exists()) {
    return null;
  }

  return sessionDoc.data() as Session;
}

/**
 * Get session by join code
 */
export async function getSessionByJoinCode(
  joinCode: string
): Promise<Session | null> {
  try {
    console.log('getSessionByJoinCode: Starting query for joinCode:', joinCode);
    const db = getDb();
    console.log('getSessionByJoinCode: Got DB instance');

    // Use single where clause to avoid needing composite index
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('joinCode', '==', joinCode)
    );
    console.log('getSessionByJoinCode: Query created, executing getDocs...');

    const querySnapshot = await getDocs(q);
    console.log('getSessionByJoinCode: Query completed! Found', querySnapshot.size, 'documents');

    if (querySnapshot.empty) {
      console.log('getSessionByJoinCode: No matching sessions found');
      return null;
    }

    const session = querySnapshot.docs[0].data() as Session;
    console.log('getSessionByJoinCode: Found session:', session.id, 'status:', session.status);

    // Check if session is active and not expired
    if (session.status !== 'active' || session.expiresAt < Date.now()) {
      console.log('getSessionByJoinCode: Session is inactive or expired');
      if (session.status === 'active') {
        await updateSessionStatus(session.id, 'expired');
      }
      return null;
    }

    return session;
  } catch (error: any) {
    console.error('getSessionByJoinCode: ERROR occurred!', error);
    console.error('getSessionByJoinCode: Error name:', error?.name);
    console.error('getSessionByJoinCode: Error message:', error?.message);
    console.error('getSessionByJoinCode: Error code:', error?.code);
    console.error('getSessionByJoinCode: Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), { status });
}

/**
 * Add restaurant to favorites
 */
export async function addFavoriteRestaurant(
  sessionId: string,
  placeId: string
): Promise<void> {
  const db = getDb();
  const session = await getSession(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.favoritedRestaurants.includes(placeId)) {
    const updatedFavorites = [...session.favoritedRestaurants, placeId];
    await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), {
      favoritedRestaurants: updatedFavorites,
    });
  }
}

/**
 * Remove restaurant from favorites
 */
export async function removeFavoriteRestaurant(
  sessionId: string,
  placeId: string
): Promise<void> {
  const db = getDb();
  const session = await getSession(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  const updatedFavorites = session.favoritedRestaurants.filter(
    id => id !== placeId
  );

  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), {
    favoritedRestaurants: updatedFavorites,
  });
}

/**
 * Subscribe to session updates
 */
export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): Unsubscribe {
  const db = getDb();

  return onSnapshot(doc(db, SESSIONS_COLLECTION, sessionId), snapshot => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const session = snapshot.data() as Session;
    callback(session);
  });
}
