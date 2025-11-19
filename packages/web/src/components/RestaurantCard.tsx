import { Restaurant, CUISINE_CATEGORIES, VENUE_CATEGORIES } from '@eatout/shared';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isEliminated: boolean;
  eliminationCount?: number;
  totalParticipants?: number;
  onToggle: () => void;
}

export function RestaurantCard({
  restaurant,
  isEliminated,
  eliminationCount = 0,
  totalParticipants = 0,
  onToggle,
}: RestaurantCardProps) {
  // Show collaborative elimination - red card with X if ANYONE eliminated it
  const showEliminated = isEliminated || eliminationCount > 0;

  // Debug: Find cuisine and venue types for this restaurant
  const restaurantTypes = restaurant.types || [];
  const cuisineTypes = restaurantTypes.filter(type =>
    CUISINE_CATEGORIES.some(c => c.type === type)
  );
  const venueTypes = restaurantTypes.filter(type =>
    VENUE_CATEGORIES.some(v => v.type === type)
  );

  return (
    <button
      onClick={onToggle}
      type="button"
      className={`
        relative rounded-lg p-2 transition-all duration-200
        cursor-pointer select-none
        flex flex-col items-center justify-center gap-0.5 min-h-[70px]
        ${
          showEliminated
            ? 'bg-red-100 border-2 border-red-300 scale-95 hover:scale-90'
            : 'bg-white border-2 border-slate-200 hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 active:scale-95'
        }
      `}
    >
      {/* Restaurant Name */}
      <h3
        className={`text-[10px] font-bold text-center line-clamp-2 leading-tight ${
          showEliminated ? 'text-red-700 line-through' : 'text-slate-900'
        }`}
      >
        {restaurant.name}
      </h3>

      {/* Rating */}
      {restaurant.rating && (
        <div className={`flex items-center gap-0.5 ${showEliminated ? 'opacity-30' : 'opacity-100'}`}>
          <svg className="w-2.5 h-2.5 fill-current text-yellow-500" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-slate-900 font-semibold text-[10px]">{restaurant.rating}</span>
        </div>
      )}

      {/* Debug: Show cuisine and venue type tags */}
      <div className="flex flex-col gap-0.5 text-[8px] mt-0.5">
        {cuisineTypes.length > 0 && (
          <div className="bg-blue-100 text-blue-800 px-1 rounded">
            C: {cuisineTypes.map(t => t.replace('_restaurant', '').replace('_', ' ')).join(', ')}
          </div>
        )}
        {venueTypes.length > 0 && (
          <div className="bg-purple-100 text-purple-800 px-1 rounded">
            V: {venueTypes.map(t => t.replace('_restaurant', '').replace('_shop', '').replace('_', ' ')).join(', ')}
          </div>
        )}
      </div>

      {/* Big X Overlay when eliminated by anyone */}
      {showEliminated && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      )}

      {/* Show count badge in corner */}
      {eliminationCount > 0 && totalParticipants > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg z-10">
          {eliminationCount}/{totalParticipants}
        </div>
      )}
    </button>
  );
}
