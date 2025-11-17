/**
 * Categorize and format Google Places types
 */

import { Restaurant, CategorizedType, TypeCategories, GroupStatistics } from '../types';

// Google Places types that represent cuisines
const CUISINE_TYPES = [
  'american_restaurant',
  'bakery',
  'bar',
  'barbecue_restaurant',
  'brazilian_restaurant',
  'breakfast_restaurant',
  'brunch_restaurant',
  'cafe',
  'chinese_restaurant',
  'coffee_shop',
  'fast_food_restaurant',
  'french_restaurant',
  'greek_restaurant',
  'hamburger_restaurant',
  'ice_cream_shop',
  'indian_restaurant',
  'indonesian_restaurant',
  'italian_restaurant',
  'japanese_restaurant',
  'korean_restaurant',
  'lebanese_restaurant',
  'meal_delivery',
  'meal_takeaway',
  'mediterranean_restaurant',
  'mexican_restaurant',
  'middle_eastern_restaurant',
  'pizza_restaurant',
  'ramen_restaurant',
  'restaurant',
  'sandwich_shop',
  'seafood_restaurant',
  'spanish_restaurant',
  'steak_house',
  'sushi_restaurant',
  'thai_restaurant',
  'turkish_restaurant',
  'vegan_restaurant',
  'vegetarian_restaurant',
  'vietnamese_restaurant',
];

// Map of type to user-friendly display name
const TYPE_DISPLAY_NAMES: Record<string, string> = {
  'american_restaurant': 'American',
  'bakery': 'Bakery',
  'bar': 'Bar / Pub',
  'barbecue_restaurant': 'BBQ',
  'brazilian_restaurant': 'Brazilian',
  'breakfast_restaurant': 'Breakfast',
  'brunch_restaurant': 'Brunch',
  'cafe': 'Cafe',
  'chinese_restaurant': 'Chinese',
  'coffee_shop': 'Coffee Shop',
  'fast_food_restaurant': 'Fast Food',
  'french_restaurant': 'French',
  'greek_restaurant': 'Greek',
  'hamburger_restaurant': 'Burgers',
  'ice_cream_shop': 'Ice Cream',
  'indian_restaurant': 'Indian',
  'indonesian_restaurant': 'Indonesian',
  'italian_restaurant': 'Italian',
  'japanese_restaurant': 'Japanese',
  'korean_restaurant': 'Korean',
  'lebanese_restaurant': 'Lebanese',
  'meal_delivery': 'Delivery',
  'meal_takeaway': 'Takeaway',
  'mediterranean_restaurant': 'Mediterranean',
  'mexican_restaurant': 'Mexican',
  'middle_eastern_restaurant': 'Middle Eastern',
  'pizza_restaurant': 'Pizza',
  'ramen_restaurant': 'Ramen',
  'restaurant': 'General Dining',
  'sandwich_shop': 'Sandwiches',
  'seafood_restaurant': 'Seafood',
  'spanish_restaurant': 'Spanish',
  'steak_house': 'Steakhouse',
  'sushi_restaurant': 'Sushi',
  'thai_restaurant': 'Thai',
  'turkish_restaurant': 'Turkish',
  'vegan_restaurant': 'Vegan',
  'vegetarian_restaurant': 'Vegetarian',
  'vietnamese_restaurant': 'Vietnamese',
};

/**
 * Check if a type is a cuisine type
 */
function isCuisineType(type: string): boolean {
  return CUISINE_TYPES.includes(type);
}

/**
 * Get display name for a type
 */
export function getTypeDisplayName(type: string): string {
  return TYPE_DISPLAY_NAMES[type] || formatTypeName(type);
}

/**
 * Format a type name to be user-friendly
 */
function formatTypeName(type: string): string {
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' Restaurant', '');
}

/**
 * Extract all unique types from restaurants
 */
export function extractTypesFromRestaurants(
  restaurants: Restaurant[]
): string[] {
  const typesSet = new Set<string>();

  restaurants.forEach(restaurant => {
    if (restaurant.types) {
      restaurant.types.forEach(type => {
        // Only include types we recognize
        if (TYPE_DISPLAY_NAMES[type]) {
          typesSet.add(type);
        }
      });
    }
  });

  return Array.from(typesSet).sort((a, b) => {
    const nameA = getTypeDisplayName(a);
    const nameB = getTypeDisplayName(b);
    return nameA.localeCompare(nameB);
  });
}

/**
 * Categorize types into cuisine types and restaurant types
 */
export function categorizeTypes(
  restaurants: Restaurant[],
  statistics?: GroupStatistics
): TypeCategories {
  const allTypes = extractTypesFromRestaurants(restaurants);

  const cuisineTypes: CategorizedType[] = [];
  const restaurantTypes: CategorizedType[] = [];

  allTypes.forEach(type => {
    // Count how many restaurants have this type
    const count = restaurants.filter(r => r.types?.includes(type)).length;

    // Get elimination count from statistics (check both cuisine and venue counts)
    const cuisineEliminations = statistics?.cuisineEliminationCounts[type] || 0;
    const venueEliminations = statistics?.venueEliminationCounts[type] || 0;
    const eliminationCount = Math.max(cuisineEliminations, venueEliminations);

    const categorizedType: CategorizedType = {
      type,
      category: isCuisineType(type) ? 'cuisine' : 'restaurant_type',
      displayName: getTypeDisplayName(type),
      count,
      eliminationCount,
    };

    if (isCuisineType(type)) {
      cuisineTypes.push(categorizedType);
    } else {
      restaurantTypes.push(categorizedType);
    }
  });

  return {
    cuisineTypes,
    restaurantTypes,
  };
}

/**
 * Check if a restaurant matches any of the eliminated types
 */
export function isRestaurantEliminated(
  restaurant: Restaurant,
  eliminatedTypes: string[]
): boolean {
  if (!restaurant.types || eliminatedTypes.length === 0) {
    return false;
  }

  return restaurant.types.some(type => eliminatedTypes.includes(type));
}

/**
 * Filter restaurants by removing those that match eliminated types
 */
export function filterRestaurantsByTypes(
  restaurants: Restaurant[],
  eliminatedTypes: string[]
): Restaurant[] {
  if (eliminatedTypes.length === 0) {
    return restaurants;
  }

  return restaurants.filter(restaurant => !isRestaurantEliminated(restaurant, eliminatedTypes));
}

/**
 * Get all unique eliminated types from group statistics
 */
export function getEliminatedTypesList(statistics: GroupStatistics): string[] {
  const cuisineTypes = Object.keys(statistics.cuisineEliminationCounts);
  const venueTypes = Object.keys(statistics.venueEliminationCounts);
  return [...new Set([...cuisineTypes, ...venueTypes])];
}

/**
 * Get types that have been eliminated by everyone in the group
 */
export function getFullyEliminatedTypes(statistics: GroupStatistics): string[] {
  const { participantCount, cuisineEliminationCounts, venueEliminationCounts } = statistics;

  if (participantCount === 0) {
    return [];
  }

  const fullyEliminatedCuisines = Object.entries(cuisineEliminationCounts)
    .filter(([_, count]) => count === participantCount)
    .map(([type]) => type);

  const fullyEliminatedVenues = Object.entries(venueEliminationCounts)
    .filter(([_, count]) => count === participantCount)
    .map(([type]) => type);

  return [...fullyEliminatedCuisines, ...fullyEliminatedVenues];
}
