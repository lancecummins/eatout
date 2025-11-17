import { RecommendationResult, getRestaurantPhotoUrl } from '@eatout/shared';

interface RecommendationsViewProps {
  recommendations: RecommendationResult | null;
  onEliminateRestaurant?: (placeId: string) => void;
  onFavoriteRestaurant?: (placeId: string) => void;
  eliminatedRestaurants?: Set<string>;
  favoritedRestaurants?: Set<string>;
}

export function RecommendationsView({
  recommendations,
  onEliminateRestaurant,
  onFavoriteRestaurant,
  eliminatedRestaurants = new Set(),
  favoritedRestaurants = new Set(),
}: RecommendationsViewProps) {
  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Recommendations Yet
        </h3>
        <p className="text-slate-600">
          Start eliminating food types to get personalized suggestions!
        </p>
      </div>
    );
  }

  // Show top 25 results
  const topResults = recommendations.recommendations.slice(0, 25);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Top {topResults.length} Suggestions
        </h2>
        <p className="text-slate-600">
          Based on {recommendations.totalParticipants}{' '}
          {recommendations.totalParticipants === 1 ? "person's" : "people's"} preferences
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Found {recommendations.totalRestaurants} restaurants • Tap ❤️ to favorite or ✕ to eliminate
        </p>
      </div>

      {/* Restaurant Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {topResults.map((rec, index) => {
          const photoUrl = getRestaurantPhotoUrl(rec.restaurant);
          const isEliminated = eliminatedRestaurants.has(rec.restaurant.place_id);
          const isFavorited = favoritedRestaurants.has(rec.restaurant.place_id);
          const showRankBadge = index < 3; // Only show rank for top 3

          const rankColors = [
            'from-yellow-500 to-yellow-600', // #1 - Gold
            'from-slate-400 to-slate-500',   // #2 - Silver
            'from-orange-600 to-orange-700', // #3 - Bronze
          ];

          return (
            <div
              key={rec.restaurant.place_id}
              className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                isEliminated
                  ? 'border-red-300 bg-red-50 opacity-50 scale-95'
                  : isFavorited
                  ? 'border-yellow-400 shadow-lg'
                  : 'border-slate-200 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              {/* Rank Badge (Top 3 only) */}
              {showRankBadge && !isEliminated && (
                <div className={`absolute top-2 left-2 z-10 w-8 h-8 bg-gradient-to-br ${rankColors[index]} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  #{index + 1}
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                {/* Favorite Button */}
                <button
                  onClick={() => onFavoriteRestaurant?.(rec.restaurant.place_id)}
                  className={`w-8 h-8 rounded-full shadow-lg transition-all ${
                    isFavorited
                      ? 'bg-yellow-400 scale-110'
                      : 'bg-white/90 hover:bg-yellow-100'
                  }`}
                  title={isFavorited ? 'Unfavorite' : 'Favorite'}
                >
                  <svg className={`w-4 h-4 mx-auto ${isFavorited ? 'fill-current text-white' : 'fill-current text-yellow-500'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>

                {/* Eliminate Button */}
                <button
                  onClick={() => onEliminateRestaurant?.(rec.restaurant.place_id)}
                  className={`w-8 h-8 rounded-full shadow-lg transition-all ${
                    isEliminated
                      ? 'bg-red-500 scale-110'
                      : 'bg-white/90 hover:bg-red-100'
                  }`}
                  title={isEliminated ? 'Restore' : 'Eliminate'}
                >
                  <svg className={`w-4 h-4 mx-auto ${isEliminated ? 'text-white' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Photo */}
              <div className="w-full h-32 bg-slate-200">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={rec.restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className={`text-sm font-bold mb-1 line-clamp-1 ${isEliminated ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {rec.restaurant.name}
                </h3>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs mb-2">
                  {rec.restaurant.rating && (
                    <div className="flex items-center">
                      <svg className="w-3 h-3 fill-current text-yellow-500 mr-1" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-slate-900 font-medium">{rec.restaurant.rating}</span>
                    </div>
                  )}
                  {rec.restaurant.price_level && (
                    <span className="text-slate-600 font-medium">
                      {'$'.repeat(rec.restaurant.price_level)}
                    </span>
                  )}
                </div>

                {/* Match Score */}
                <div className="text-xs text-center">
                  <span className="text-primary-600 font-bold">{Math.round(rec.score * 100)}% match</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200">
        <div className="text-center">
          <h3 className="font-semibold text-slate-900 mb-2">
            Found your favorite?
          </h3>
          <p className="text-sm text-slate-600">
            Tap the ❤️ to mark restaurants you love, or ✕ to eliminate ones you don't want!
          </p>
        </div>
      </div>
    </div>
  );
}
