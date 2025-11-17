/**
 * Predefined list of popular restaurant/cuisine categories
 * These are shown to users in a grid for quick elimination
 */

export interface PredefinedCategory {
  type: string; // Google Places type
  displayName: string;
  emoji: string; // Visual icon
  category: 'cuisine' | 'venue';
}

/**
 * Cuisine types - Stage 1 elimination
 */
export const CUISINE_CATEGORIES: PredefinedCategory[] = [
  { type: 'american_restaurant', displayName: 'American', emoji: '🍔', category: 'cuisine' },
  { type: 'italian_restaurant', displayName: 'Italian', emoji: '🍝', category: 'cuisine' },
  { type: 'mexican_restaurant', displayName: 'Mexican', emoji: '🌮', category: 'cuisine' },
  { type: 'chinese_restaurant', displayName: 'Chinese', emoji: '🥡', category: 'cuisine' },
  { type: 'japanese_restaurant', displayName: 'Japanese', emoji: '🍱', category: 'cuisine' },
  { type: 'thai_restaurant', displayName: 'Thai', emoji: '🍜', category: 'cuisine' },
  { type: 'indian_restaurant', displayName: 'Indian', emoji: '🍛', category: 'cuisine' },
  { type: 'pizza_restaurant', displayName: 'Pizza', emoji: '🍕', category: 'cuisine' },
  { type: 'sushi_restaurant', displayName: 'Sushi', emoji: '🍣', category: 'cuisine' },
  { type: 'seafood_restaurant', displayName: 'Seafood', emoji: '🦞', category: 'cuisine' },
  { type: 'steak_house', displayName: 'Steakhouse', emoji: '🥩', category: 'cuisine' },
  { type: 'barbecue_restaurant', displayName: 'BBQ', emoji: '🍖', category: 'cuisine' },
  { type: 'mediterranean_restaurant', displayName: 'Mediterranean', emoji: '🥙', category: 'cuisine' },
  { type: 'korean_restaurant', displayName: 'Korean', emoji: '🍲', category: 'cuisine' },
  { type: 'vietnamese_restaurant', displayName: 'Vietnamese', emoji: '🥢', category: 'cuisine' },
  { type: 'french_restaurant', displayName: 'French', emoji: '🥖', category: 'cuisine' },
  { type: 'greek_restaurant', displayName: 'Greek', emoji: '🫒', category: 'cuisine' },
  { type: 'spanish_restaurant', displayName: 'Spanish', emoji: '🥘', category: 'cuisine' },
  { type: 'middle_eastern_restaurant', displayName: 'Middle Eastern', emoji: '🧆', category: 'cuisine' },
  { type: 'latin_american_restaurant', displayName: 'Latin American', emoji: '🌶️', category: 'cuisine' },
];

/**
 * Venue types - Stage 2 elimination
 */
export const VENUE_CATEGORIES: PredefinedCategory[] = [
  { type: 'fast_food_restaurant', displayName: 'Fast Food', emoji: '🍟', category: 'venue' },
  { type: 'cafe', displayName: 'Cafe', emoji: '☕', category: 'venue' },
  { type: 'bar', displayName: 'Bar/Pub', emoji: '🍺', category: 'venue' },
  { type: 'bakery', displayName: 'Bakery', emoji: '🥐', category: 'venue' },
  { type: 'sandwich_shop', displayName: 'Sandwich Shop', emoji: '🥪', category: 'venue' },
  { type: 'breakfast_restaurant', displayName: 'Breakfast', emoji: '🥞', category: 'venue' },
  { type: 'brunch_restaurant', displayName: 'Brunch', emoji: '🍳', category: 'venue' },
  { type: 'ice_cream_shop', displayName: 'Dessert', emoji: '🍨', category: 'venue' },
  { type: 'fine_dining_restaurant', displayName: 'Fine Dining', emoji: '🍽️', category: 'venue' },
  { type: 'casual_dining_restaurant', displayName: 'Casual Dining', emoji: '🍴', category: 'venue' },
];

/**
 * All categories combined (for backwards compatibility)
 */
export const PREDEFINED_CATEGORIES: PredefinedCategory[] = [
  ...CUISINE_CATEGORIES,
  ...VENUE_CATEGORIES,
];

/**
 * Get a predefined category by type
 */
export function getPredefinedCategory(type: string): PredefinedCategory | undefined {
  return PREDEFINED_CATEGORIES.find(cat => cat.type === type);
}

/**
 * Get display name for a type (with fallback)
 */
export function getCategoryDisplayName(type: string): string {
  const predefined = getPredefinedCategory(type);
  if (predefined) {
    return predefined.displayName;
  }

  // Fallback: format the type name
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' Restaurant', '');
}

/**
 * Get emoji for a type (with fallback)
 */
export function getCategoryEmoji(type: string): string {
  const predefined = getPredefinedCategory(type);
  return predefined?.emoji || '🍽️';
}
