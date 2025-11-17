import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  duration: number; // Duration in seconds
  onComplete?: () => void;
  autoAdvance?: boolean; // Whether to auto-advance when timer hits 0
}

export function CountdownTimer({ duration, onComplete, autoAdvance = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (autoAdvance && onComplete) {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeLeft, onComplete, autoAdvance]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / duration) * 100;

  // Color changes as time runs out
  const getColor = () => {
    if (percentage > 50) return 'from-green-500 to-green-600';
    if (percentage > 25) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="flex items-center gap-4">
      {/* Timer display */}
      <div className={`flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getColor()} text-white shadow-lg`}>
        <div className="text-center">
          <div className="text-2xl font-bold leading-none">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs opacity-80 mt-1">left</div>
        </div>
      </div>

      {/* Pause/Resume button */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="btn btn-secondary py-2 px-4 text-sm"
      >
        {isPaused ? (
          <>
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Resume
          </>
        ) : (
          <>
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" />
            </svg>
            Pause
          </>
        )}
      </button>

      {/* Skip button */}
      {onComplete && (
        <button
          onClick={onComplete}
          className="text-sm text-slate-600 hover:text-slate-900 underline"
        >
          Skip to next stage →
        </button>
      )}
    </div>
  );
}
