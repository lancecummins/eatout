interface ProgressBarProps {
  currentStage: 'cuisines' | 'venues' | 'restaurants' | 'complete';
  onStageClick?: (stage: 'cuisines' | 'venues' | 'restaurants' | 'complete') => void;
}

const STAGES = [
  { id: 'cuisines' as const, label: 'Cuisines', step: 1 },
  { id: 'venues' as const, label: 'Venues', step: 2 },
  { id: 'restaurants' as const, label: 'Restaurants', step: 3 },
  { id: 'complete' as const, label: 'Results', step: 4 },
];

export function ProgressBar({ currentStage }: ProgressBarProps) {
  const currentStageIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out"
        style={{ width: `${((currentStageIndex + 1) / STAGES.length) * 100}%` }}
      />
    </div>
  );
}

export function ProgressSteps({ currentStage, onStageClick }: ProgressBarProps) {
  const currentStep = STAGES.findIndex(s => s.id === currentStage) + 1;

  return (
    <div className="flex items-center justify-between">
      {STAGES.map((stage, index) => {
        const isComplete = index < currentStep - 1;
        const isCurrent = index === currentStep - 1;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            <button
              onClick={() => onStageClick?.(stage.id)}
              className="flex flex-col items-center flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              disabled={!onStageClick}
            >
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isComplete
                    ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white scale-100'
                    : isCurrent
                    ? 'bg-gradient-to-br from-primary-600 to-secondary-600 text-white scale-110 shadow-lg'
                    : 'bg-slate-200 text-slate-400 scale-90'
                }`}
              >
                {isComplete ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  stage.step
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isCurrent ? 'text-primary-700' : isComplete ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
            </button>

            {/* Connector line (not on last item) */}
            {index < STAGES.length - 1 && (
              <div className="flex-1 h-1 mx-2 -mt-8">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isComplete ? 'bg-gradient-to-r from-primary-500 to-secondary-500' : 'bg-slate-200'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
