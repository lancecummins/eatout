/**
 * Hook to manage anonymous user ID
 */

import { useState } from 'react';

const USER_ID_KEY = 'eatout_user_id';

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useUserId(): string {
  const [userId] = useState<string>(() => {
    // Try to get existing user ID from localStorage
    const existingId = localStorage.getItem(USER_ID_KEY);
    if (existingId) {
      return existingId;
    }

    // Generate new user ID
    const newId = generateUserId();
    localStorage.setItem(USER_ID_KEY, newId);
    return newId;
  });

  return userId;
}
