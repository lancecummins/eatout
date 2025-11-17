/**
 * Firestore operations for User Responses
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './config';
import { UserResponse, GroupStatistics } from '../types';

const RESPONSES_COLLECTION = 'responses';

/**
 * Create or update user response
 */
export async function saveUserResponse(
  sessionId: string,
  userId: string,
  data: {
    eliminatedCuisines?: string[];
    eliminatedVenues?: string[];
    eliminatedRestaurants?: string[];
    currentStage?: 'cuisines' | 'venues' | 'restaurants' | 'complete';
    userName?: string;
  }
): Promise<UserResponse> {
  const db = getDb();
  const responseId = `${sessionId}_${userId}`;
  const now = Date.now();

  // Check if response already exists
  const existingResponse = await getUserResponse(sessionId, userId);

  const response: UserResponse = {
    id: responseId,
    sessionId,
    userId,
    userName: data.userName || existingResponse?.userName,
    eliminatedCuisines: data.eliminatedCuisines ?? existingResponse?.eliminatedCuisines ?? [],
    eliminatedVenues: data.eliminatedVenues ?? existingResponse?.eliminatedVenues ?? [],
    eliminatedRestaurants: data.eliminatedRestaurants ?? existingResponse?.eliminatedRestaurants ?? [],
    currentStage: data.currentStage ?? existingResponse?.currentStage ?? 'cuisines',
    createdAt: existingResponse?.createdAt || now,
    updatedAt: now,
  };

  // Remove undefined fields before saving to Firestore
  const dataToSave: any = { ...response };
  if (dataToSave.userName === undefined) {
    delete dataToSave.userName;
  }

  await setDoc(doc(db, RESPONSES_COLLECTION, responseId), dataToSave);

  return response;
}

/**
 * Get user response
 */
export async function getUserResponse(
  sessionId: string,
  userId: string
): Promise<UserResponse | null> {
  const db = getDb();
  const responseId = `${sessionId}_${userId}`;
  const responseDoc = await getDoc(doc(db, RESPONSES_COLLECTION, responseId));

  if (!responseDoc.exists()) {
    return null;
  }

  return responseDoc.data() as UserResponse;
}

/**
 * Get all responses for a session
 */
export async function getSessionResponses(
  sessionId: string
): Promise<UserResponse[]> {
  const db = getDb();
  const q = query(
    collection(db, RESPONSES_COLLECTION),
    where('sessionId', '==', sessionId)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => doc.data() as UserResponse);
}

/**
 * Add cuisine to user's elimination list
 */
export async function eliminateCuisine(
  sessionId: string,
  userId: string,
  type: string
): Promise<void> {
  const response = await getUserResponse(sessionId, userId);

  const currentEliminated = response?.eliminatedCuisines || [];
  if (!currentEliminated.includes(type)) {
    await saveUserResponse(sessionId, userId, {
      eliminatedCuisines: [...currentEliminated, type],
    });
  }
}

/**
 * Remove cuisine from user's elimination list
 */
export async function unEliminateCuisine(
  sessionId: string,
  userId: string,
  type: string
): Promise<void> {
  const response = await getUserResponse(sessionId, userId);

  if (!response) return;

  await saveUserResponse(sessionId, userId, {
    eliminatedCuisines: response.eliminatedCuisines.filter(t => t !== type),
  });
}

/**
 * Add venue type to user's elimination list
 */
export async function eliminateVenue(
  sessionId: string,
  userId: string,
  type: string
): Promise<void> {
  const response = await getUserResponse(sessionId, userId);

  const currentEliminated = response?.eliminatedVenues || [];
  if (!currentEliminated.includes(type)) {
    await saveUserResponse(sessionId, userId, {
      eliminatedVenues: [...currentEliminated, type],
    });
  }
}

/**
 * Remove venue type from user's elimination list
 */
export async function unEliminateVenue(
  sessionId: string,
  userId: string,
  type: string
): Promise<void> {
  const response = await getUserResponse(sessionId, userId);

  if (!response) return;

  await saveUserResponse(sessionId, userId, {
    eliminatedVenues: response.eliminatedVenues.filter(t => t !== type),
  });
}

/**
 * Add restaurant to user's elimination list
 */
export async function eliminateRestaurant(
  sessionId: string,
  userId: string,
  placeId: string
): Promise<void> {
  const response = await getUserResponse(sessionId, userId);

  const currentEliminated = response?.eliminatedRestaurants || [];
  if (!currentEliminated.includes(placeId)) {
    await saveUserResponse(sessionId, userId, {
      eliminatedRestaurants: [...currentEliminated, placeId],
    });
  }
}

/**
 * Remove restaurant from user's elimination list
 */
export async function unEliminateRestaurant(
  sessionId: string,
  userId: string,
  placeId: string
): Promise<void> {
  const response = await getUserResponse(sessionId, userId);

  if (!response) return;

  await saveUserResponse(sessionId, userId, {
    eliminatedRestaurants: response.eliminatedRestaurants.filter(id => id !== placeId),
  });
}

/**
 * Update user's current stage
 */
export async function updateStage(
  sessionId: string,
  userId: string,
  stage: 'cuisines' | 'venues' | 'restaurants' | 'complete'
): Promise<void> {
  await saveUserResponse(sessionId, userId, {
    currentStage: stage,
  });
}

// Legacy functions for backwards compatibility
export const eliminateType = eliminateCuisine;
export const unEliminateType = unEliminateCuisine;

/**
 * Calculate group statistics from all responses
 */
export async function calculateGroupStatistics(
  sessionId: string
): Promise<GroupStatistics> {
  const responses = await getSessionResponses(sessionId);

  const cuisineEliminationCounts: Record<string, number> = {};
  const venueEliminationCounts: Record<string, number> = {};
  const restaurantEliminationCounts: Record<string, number> = {};
  let totalEliminations = 0;

  responses.forEach(response => {
    // Count cuisine eliminations
    response.eliminatedCuisines?.forEach(type => {
      cuisineEliminationCounts[type] = (cuisineEliminationCounts[type] || 0) + 1;
      totalEliminations++;
    });

    // Count venue eliminations
    response.eliminatedVenues?.forEach(type => {
      venueEliminationCounts[type] = (venueEliminationCounts[type] || 0) + 1;
      totalEliminations++;
    });

    // Count restaurant eliminations
    response.eliminatedRestaurants?.forEach(placeId => {
      restaurantEliminationCounts[placeId] = (restaurantEliminationCounts[placeId] || 0) + 1;
      totalEliminations++;
    });
  });

  return {
    sessionId,
    participantCount: responses.length,
    totalEliminations,
    cuisineEliminationCounts,
    venueEliminationCounts,
    restaurantEliminationCounts,
    updatedAt: Date.now(),
  };
}

/**
 * Subscribe to all responses for a session
 */
export function subscribeToSessionResponses(
  sessionId: string,
  callback: (responses: UserResponse[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, RESPONSES_COLLECTION),
    where('sessionId', '==', sessionId)
  );

  return onSnapshot(q, snapshot => {
    const responses = snapshot.docs.map(doc => doc.data() as UserResponse);
    callback(responses);
  });
}
