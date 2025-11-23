/**
 * Google Places API (New) Integration
 * Documentation: https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

import { Restaurant, PlacesSearchParams } from '../types';

/**
 * Fisher-Yates shuffle algorithm to randomize array in-place
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

export interface PlacesApiConfig {
  apiKey: string;
}

interface NewPlacesApiResponse {
  places?: NewPlace[];
}

interface NewPlace {
  id: string;
  displayName?: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  types?: string[];
  currentOpeningHours?: {
    openNow: boolean;
  };
  businessStatus?: string;
}

let apiKey: string | null = null;

/**
 * Initialize Places API with configuration
 */
export function initializePlacesApi(config: PlacesApiConfig): void {
  apiKey = config.apiKey;
}

/**
 * Convert new API place to our Restaurant type
 */
function convertNewPlaceToRestaurant(place: NewPlace): Restaurant {
  return {
    place_id: place.id,
    name: place.displayName?.text || 'Unknown',
    vicinity: place.formattedAddress || '',
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    price_level: place.priceLevel ? parsePriceLevel(place.priceLevel) : undefined,
    photos: place.photos?.map(photo => ({
      photo_reference: photo.name,
      height: photo.heightPx,
      width: photo.widthPx,
      html_attributions: [],
    })),
    geometry: {
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      },
    },
    types: place.types,
    opening_hours: place.currentOpeningHours ? {
      open_now: place.currentOpeningHours.openNow,
    } : undefined,
    business_status: place.businessStatus,
  };
}

/**
 * Parse price level from new API format
 */
function parsePriceLevel(priceLevel: string): number {
  const map: Record<string, number> = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
  };
  return map[priceLevel] || 0;
}

/**
 * Search for restaurants by a specific type
 */
async function searchByType(
  location: { latitude: number; longitude: number },
  radius: number,
  type: string
): Promise<Restaurant[]> {
  if (!apiKey) {
    throw new Error('Places API not initialized.');
  }

  const url = `${PLACES_API_BASE}/places:searchNearby`;

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.priceLevel',
    'places.photos',
    'places.types',
    'places.currentOpeningHours',
    'places.businessStatus',
  ].join(',');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        includedTypes: [type],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            radius: radius,
          },
        },
      }),
    });

    if (!response.ok) {
      // Don't throw on 404 or empty results - just return empty array
      const errorText = await response.text();
      console.warn(`No results for type ${type}: ${response.status}`, errorText);
      return [];
    }

    const data = await response.json() as NewPlacesApiResponse;

    if (!data.places || data.places.length === 0) {
      console.log(`Type ${type}: 0 results`);
      return [];
    }

    console.log(`Type ${type}: ${data.places.length} results`);
    return data.places.map(convertNewPlaceToRestaurant);
  } catch (error) {
    console.error(`Error fetching restaurants for type ${type}:`, error);
    return [];
  }
}

/**
 * Search for nearby restaurants using Places API (New)
 * Searches across multiple cuisine types in parallel to get comprehensive results
 */
export async function searchNearbyRestaurants(
  params: PlacesSearchParams
): Promise<Restaurant[]> {
  if (!apiKey) {
    throw new Error('Places API not initialized. Call initializePlacesApi() first.');
  }

  const { location, radius = 5000, types } = params;

  console.log('searchNearbyRestaurants called with:', {
    location,
    radius,
    types,
    apiKeyPresent: !!apiKey
  });

  // If specific types are provided, search for those
  // Otherwise, search for all predefined categories
  const typesToSearch = types || [
    'american_restaurant',
    'italian_restaurant',
    'mexican_restaurant',
    'chinese_restaurant',
    'japanese_restaurant',
    'thai_restaurant',
    'indian_restaurant',
    'french_restaurant',
    'mediterranean_restaurant',
    'greek_restaurant',
    'spanish_restaurant',
    'korean_restaurant',
    'vietnamese_restaurant',
    'middle_eastern_restaurant',
    // 'latin_american_restaurant', // Removed - not supported by API
    'fast_food_restaurant',
    'cafe',
    'pizza_restaurant',
    'sandwich_shop',
    'seafood_restaurant',
    'steak_house',
    'barbecue_restaurant',
    'bakery',
    'bar',
    'breakfast_restaurant',
  ];

  console.log(`Searching for restaurants in ${typesToSearch.length} categories...`);

  // Search all types in parallel
  const searchPromises = typesToSearch.map(type =>
    searchByType(location, radius, type)
  );

  const results = await Promise.all(searchPromises);

  // Flatten and deduplicate by place_id
  const restaurantMap = new Map<string, Restaurant>();

  results.forEach(restaurantList => {
    restaurantList.forEach(restaurant => {
      if (!restaurantMap.has(restaurant.place_id)) {
        restaurantMap.set(restaurant.place_id, restaurant);
      }
    });
  });

  const uniqueRestaurants = Array.from(restaurantMap.values());

  console.log(`Found ${uniqueRestaurants.length} unique restaurants across all categories`);

  // Shuffle results so users see different restaurants each time
  const shuffledRestaurants = shuffleArray(uniqueRestaurants);

  console.log('Shuffled restaurant order for variety');

  return shuffledRestaurants;
}

/**
 * Get restaurant details by place ID using Places API (New)
 */
export async function getRestaurantDetails(placeId: string): Promise<Restaurant | null> {
  if (!apiKey) {
    throw new Error('Places API not initialized. Call initializePlacesApi() first.');
  }

  const url = `${PLACES_API_BASE}/${placeId}`;

  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
    'location',
    'rating',
    'userRatingCount',
    'priceLevel',
    'photos',
    'types',
    'currentOpeningHours',
    'businessStatus',
  ].join(',');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    if (!response.ok) {
      console.error(`Places API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as NewPlace;
    return convertNewPlaceToRestaurant(data);
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return null;
  }
}

/**
 * Get photo URL from photo name (new API uses photo.name instead of photo_reference)
 */
export function getPhotoUrl(
  photoName: string,
  maxWidth: number = 400
): string {
  if (!apiKey) {
    throw new Error('Places API not initialized. Call initializePlacesApi() first.');
  }

  // New API format: GET https://places.googleapis.com/v1/{photo.name}/media
  // photo.name format: "places/{place_id}/photos/{photo_id}"
  return `${PLACES_API_BASE}/${photoName}/media?key=${apiKey}&maxWidthPx=${maxWidth}`;
}

/**
 * Get the first photo URL for a restaurant
 */
export function getRestaurantPhotoUrl(restaurant: Restaurant, maxWidth: number = 400): string | null {
  if (!restaurant.photos || restaurant.photos.length === 0) {
    return null;
  }

  return getPhotoUrl(restaurant.photos[0].photo_reference, maxWidth);
}
