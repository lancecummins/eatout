import { PredefinedCategory } from '@eatout/shared';

interface CategoryCardProps {
  category: PredefinedCategory;
  isEliminated: boolean;
  eliminationCount?: number;
  totalParticipants?: number;
  onToggle: () => void;
}

export function CategoryCard({
  category,
  isEliminated,
  eliminationCount = 0,
  totalParticipants = 0,
  onToggle,
}: CategoryCardProps) {
  // Show collaborative elimination - red card with X if ANYONE eliminated it
  const showEliminated = isEliminated || eliminationCount > 0;

  return (
    <button
      onClick={onToggle}
      type="button"
      className={`
        relative aspect-square rounded-xl p-4 transition-all duration-200
        flex flex-col items-center justify-center gap-2
        cursor-pointer select-none
        ${
          showEliminated
            ? 'bg-red-100 border-2 border-red-300 scale-95 hover:scale-90'
            : 'bg-white border-2 border-slate-200 hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 active:scale-95'
        }
      `}
    >
      {/* Emoji */}
      <div className={`text-6xl md:text-7xl transition-opacity ${showEliminated ? 'opacity-30' : 'opacity-100'}`}>
        {category.emoji}
      </div>

      {/* Name */}
      <div
        className={`
          text-base md:text-lg font-semibold text-center transition-all
          ${showEliminated ? 'text-red-700 line-through' : 'text-slate-900'}
        `}
      >
        {category.displayName}
      </div>

      {/* Big X Overlay when eliminated by anyone */}
      {showEliminated && (
        <div className="absolute inset-0 flex items-center justify-center">
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

      {/* Show count badge in corner */}
      {eliminationCount > 0 && totalParticipants > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
          {eliminationCount}/{totalParticipants}
        </div>
      )}
    </button>
  );
}
