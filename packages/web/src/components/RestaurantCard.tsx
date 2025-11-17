import { Restaurant, getRestaurantPhotoUrl } from '@eatout/shared';

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
  const photoUrl = getRestaurantPhotoUrl(restaurant);

  return (
    <button
      onClick={onToggle}
      type="button"
      className={`
        relative rounded-xl overflow-hidden transition-all duration-200
        cursor-pointer select-none
        ${
          showEliminated
            ? 'bg-red-100 border-2 border-red-300 scale-95 hover:scale-90'
            : 'bg-white border-2 border-slate-200 hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 active:scale-95'
        }
      `}
    >
      {/* Photo */}
      <div className={`w-full h-32 bg-slate-200 relative ${showEliminated ? 'opacity-30' : 'opacity-100'}`}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Big X Overlay when eliminated by anyone */}
        {showEliminated && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100/50">
            <svg
              className="w-20 h-20 text-red-600"
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
      </div>

      {/* Content */}
      <div className="p-3">
        <h3
          className={`text-sm font-bold mb-1 line-clamp-1 ${
            showEliminated ? 'text-red-700 line-through' : 'text-slate-900'
          }`}
        >
          {restaurant.name}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs">
          {restaurant.rating && (
            <div className="flex items-center">
              <svg className="w-3 h-3 fill-current text-yellow-500 mr-1" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-slate-900 font-medium">{restaurant.rating}</span>
            </div>
          )}
          {restaurant.price_level && (
            <span className="text-slate-600 font-medium">
              {'$'.repeat(restaurant.price_level)}
            </span>
          )}
        </div>
      </div>

      {/* Show count badge in corner */}
      {eliminationCount > 0 && totalParticipants > 0 && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-10">
          {eliminationCount}/{totalParticipants}
        </div>
      )}
    </button>
  );
}
