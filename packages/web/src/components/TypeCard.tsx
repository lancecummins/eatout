import { CategorizedType } from '@eatout/shared';

interface TypeCardProps {
  categorizedType: CategorizedType;
  isEliminated: boolean;
  totalParticipants: number;
  onToggleEliminate: () => void;
}

export function TypeCard({
  categorizedType,
  isEliminated,
  totalParticipants,
  onToggleEliminate,
}: TypeCardProps) {
  const { displayName, count, eliminationCount } = categorizedType;

  const eliminationPercentage = totalParticipants > 0
    ? Math.round((eliminationCount / totalParticipants) * 100)
    : 0;

  return (
    <button
      onClick={onToggleEliminate}
      className={`w-full card transition-all duration-200 text-left ${
        isEliminated
          ? 'bg-red-50 border-2 border-red-200'
          : 'hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Type Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-lg mb-1 ${
            isEliminated ? 'text-slate-500 line-through' : 'text-slate-900'
          }`}>
            {displayName}
          </h3>

          <div className="flex items-center gap-3 text-sm">
            {/* Restaurant Count */}
            <span className="text-slate-600">
              {count} {count === 1 ? 'place' : 'places'} nearby
            </span>

            {/* Elimination Stats */}
            {eliminationCount > 0 && (
              <span className="text-red-600">
                {eliminationCount}/{totalParticipants} eliminated ({eliminationPercentage}%)
              </span>
            )}
          </div>
        </div>

        {/* Eliminate Button/Icon */}
        <div className="flex-shrink-0">
          {isEliminated ? (
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-600"
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
          ) : (
            <div className="w-12 h-12 rounded-lg border-2 border-slate-300 flex items-center justify-center group-hover:border-red-400 transition-colors">
              <svg
                className="w-6 h-6 text-slate-400 group-hover:text-red-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
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
      </div>
    </button>
  );
}
