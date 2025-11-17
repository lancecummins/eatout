/**
 * Core type definitions for EatOut app
 */

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  id: string;
  joinCode: string;
  adminId: string;
  createdAt: number;
  expiresAt: number;
  location: Location;
  favoritedRestaurants: string[]; // Restaurant place_ids
  status: SessionStatus;
}

export type SessionStatus = 'active' | 'completed' | 'expired';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  radius?: number; // in meters, default 5000
}

// ============================================================================
// User Response Types
// ============================================================================

export interface UserResponse {
  id: string;
  sessionId: string;
  userId: string;
  userName?: string;
  eliminatedCuisines: string[]; // Cuisine types (e.g., "italian_restaurant", "chinese_restaurant")
  eliminatedVenues: string[]; // Venue types (e.g., "fast_food_restaurant", "cafe")
  eliminatedRestaurants: string[]; // Specific restaurant place_ids
  currentStage: 'cuisines' | 'venues' | 'restaurants' | 'complete'; // Track user's progress
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Restaurant Types (from Google Places)
// ============================================================================

export interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: RestaurantPhoto[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  opening_hours?: {
    open_now?: boolean;
  };
  business_status?: string;
}

export interface RestaurantPhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface Recommendation {
  restaurant: Restaurant;
  score: number;
  eliminationCount: number;
  isFavorited: boolean;
  reasoning?: string;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  totalParticipants: number;
  totalRestaurants: number;
  timestamp: number;
}

// ============================================================================
// Group Statistics
// ============================================================================

export interface GroupStatistics {
  sessionId: string;
  participantCount: number;
  totalEliminations: number;
  cuisineEliminationCounts: Record<string, number>; // cuisine type -> count
  venueEliminationCounts: Record<string, number>; // venue type -> count
  restaurantEliminationCounts: Record<string, number>; // place_id -> count
  updatedAt: number;
}

// ============================================================================
// UI/Client Types
// ============================================================================

export interface SessionWithStats extends Session {
  statistics: GroupStatistics;
  participants: UserResponse[];
}

export type RestaurantWithStatus = Restaurant & {
  isEliminated: boolean;
  eliminationCount: number;
  isFavorited: boolean;
};

// ============================================================================
// Type Categorization
// ============================================================================

export type TypeCategory = 'cuisine' | 'restaurant_type';

export interface CategorizedType {
  type: string; // Google Places type (e.g., "italian_restaurant", "cafe")
  category: TypeCategory;
  displayName: string; // User-friendly name (e.g., "Italian", "Cafe")
  count: number; // Number of nearby restaurants of this type
  eliminationCount: number; // How many people eliminated this type
}

export interface TypeCategories {
  cuisineTypes: CategorizedType[];
  restaurantTypes: CategorizedType[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PlacesSearchParams {
  location: Location;
  radius?: number;
  types?: string[]; // Optional array of Google Places types to search
  keyword?: string;
}
