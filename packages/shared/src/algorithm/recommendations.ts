/**
 * Recommendation Algorithm
 *
 * Suggests restaurants based on:
 * 1. Fewest eliminations across the group
 * 2. Admin favorited restaurants get priority
 * 3. Restaurant quality (rating, review count)
 */

import {
  Restaurant,
  GroupStatistics,
  Recommendation,
  RecommendationResult,
} from '../types';

export interface RecommendationOptions {
  maxRecommendations?: number;
  favoriteBoost?: number;
  qualityWeight?: number;
}

const DEFAULT_OPTIONS: Required<RecommendationOptions> = {
  maxRecommendations: 3,
  favoriteBoost: 0.5, // Reduces elimination penalty by 50% for favorites
  qualityWeight: 0.1, // 10% weight for quality scoring
};

/**
 * Generate restaurant recommendations based on group eliminations
 */
export function generateRecommendations(
  restaurants: Restaurant[],
  favoritedPlaceIds: string[],
  statistics: GroupStatistics,
  options: RecommendationOptions = {}
): RecommendationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const {
    participantCount,
    cuisineEliminationCounts,
    venueEliminationCounts,
    restaurantEliminationCounts
  } = statistics;

  // Score each restaurant
  const scoredRestaurants: Recommendation[] = restaurants.map(restaurant => {
    const isFavorited = favoritedPlaceIds.includes(restaurant.place_id);

    // Calculate type elimination penalty (both cuisine and venue)
    let totalTypeEliminationRate = 0;
    let typeCount = 0;

    if (restaurant.types) {
      restaurant.types.forEach(type => {
        const cuisineEliminations = cuisineEliminationCounts[type] || 0;
        const venueEliminations = venueEliminationCounts[type] || 0;
        const typeEliminations = Math.max(cuisineEliminations, venueEliminations);

        totalTypeEliminationRate += participantCount > 0 ? typeEliminations / participantCount : 0;
        typeCount++;
      });
    }

    const avgTypeEliminationRate = typeCount > 0 ? totalTypeEliminationRate / typeCount : 0;

    // Add direct restaurant elimination penalty
    const restaurantEliminations = restaurantEliminationCounts[restaurant.place_id] || 0;
    const restaurantEliminationRate = participantCount > 0 ? restaurantEliminations / participantCount : 0;

    // Combined elimination penalty
    const totalEliminationPenalty = Math.max(avgTypeEliminationRate, restaurantEliminationRate);

    // Apply favorite boost
    const adjustedPenalty = isFavorited
      ? totalEliminationPenalty * (1 - opts.favoriteBoost)
      : totalEliminationPenalty;

    // Calculate quality score (0-1 based on rating)
    const qualityScore = calculateQualityScore(restaurant);

    // Final score: start at 1, subtract elimination penalty, add quality bonus
    const score = 1 - adjustedPenalty + (qualityScore * opts.qualityWeight);

    // Total elimination count (max of type or direct restaurant eliminations)
    const eliminationCount = restaurantEliminations || (restaurant.types
      ? Math.max(
          ...restaurant.types.map(type =>
            Math.max(cuisineEliminationCounts[type] || 0, venueEliminationCounts[type] || 0)
          )
        )
      : 0);

    return {
      restaurant,
      score,
      eliminationCount,
      isFavorited,
      reasoning: generateReasoning(
        eliminationCount,
        participantCount,
        isFavorited,
        restaurant
      ),
    };
  });

  // Sort by score (highest first) and take top N
  const recommendations = scoredRestaurants
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.maxRecommendations);

  return {
    recommendations,
    totalParticipants: participantCount,
    totalRestaurants: restaurants.length,
    timestamp: Date.now(),
  };
}

/**
 * Calculate quality score based on rating and review count
 */
function calculateQualityScore(restaurant: Restaurant): number {
  const rating = restaurant.rating || 0;
  const reviewCount = restaurant.user_ratings_total || 0;

  // Normalize rating (0-5 scale to 0-1)
  const normalizedRating = rating / 5;

  // Confidence factor based on review count (more reviews = more confident)
  // Using logarithmic scale: 10 reviews = 0.5, 100 reviews = 0.75, 1000+ = 1.0
  const confidence = Math.min(1, Math.log10(reviewCount + 1) / 3);

  // Weighted rating based on confidence
  return normalizedRating * (0.5 + 0.5 * confidence);
}

/**
 * Generate human-readable reasoning for recommendation
 */
function generateReasoning(
  eliminationCount: number,
  participantCount: number,
  isFavorited: boolean,
  restaurant: Restaurant
): string {
  const reasons: string[] = [];

  if (eliminationCount === 0) {
    reasons.push('No one eliminated this');
  } else if (eliminationCount === 1) {
    reasons.push('Only 1 person eliminated this');
  } else {
    const percentage = Math.round((eliminationCount / participantCount) * 100);
    reasons.push(`${eliminationCount} people (${percentage}%) eliminated this`);
  }

  if (isFavorited) {
    reasons.push('Admin favorite');
  }

  if (restaurant.rating && restaurant.rating >= 4.0) {
    reasons.push(`${restaurant.rating}★ rating`);
  }

  return reasons.join(' • ');
}

/**
 * Filter restaurants to exclude those eliminated by everyone
 */
export function filterViableRestaurants(
  restaurants: Restaurant[],
  statistics: GroupStatistics
): Restaurant[] {
  const {
    participantCount,
    cuisineEliminationCounts,
    venueEliminationCounts,
    restaurantEliminationCounts
  } = statistics;

  if (participantCount === 0) {
    return restaurants;
  }

  return restaurants.filter(restaurant => {
    // Check if restaurant itself was eliminated by everyone
    const restaurantEliminations = restaurantEliminationCounts[restaurant.place_id] || 0;
    if (restaurantEliminations === participantCount) {
      return false;
    }

    if (!restaurant.types) {
      return true; // Keep restaurants without types
    }

    // Keep restaurant if ALL its types haven't been eliminated by everyone
    return !restaurant.types.every(type => {
      const cuisineEliminations = cuisineEliminationCounts[type] || 0;
      const venueEliminations = venueEliminationCounts[type] || 0;
      const maxEliminations = Math.max(cuisineEliminations, venueEliminations);
      return maxEliminations === participantCount;
    });
  });
}
