import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSessionByJoinCode, cleanJoinCode } from '@eatout/shared';

export function JoinSessionPage() {
  const navigate = useNavigate();
  const { joinCode: urlJoinCode } = useParams();
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If join code is in URL, auto-join
  useEffect(() => {
    if (urlJoinCode) {
      handleJoinSession(urlJoinCode);
    }
  }, [urlJoinCode]);

  const handleJoinSession = async (code?: string) => {
    const codeToUse = code || joinCode;
    if (!codeToUse.trim()) {
      setError('Please enter a join code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cleanCode = cleanJoinCode(codeToUse);
      const session = await getSessionByJoinCode(cleanCode);

      if (!session) {
        setError('Session not found or has expired');
        return;
      }

      // Navigate to session
      navigate(`/session/${session.id}`);
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setJoinCode(value);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleJoinSession();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Join Session
          </h1>
          <p className="text-slate-600">
            Enter the code shared by your group
          </p>
        </div>

        {/* Main Card */}
        <div className="card space-y-6">
          {/* Group Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-secondary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="joinCode"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Join Code
              </label>
              <input
                type="text"
                id="joinCode"
                value={joinCode}
                onChange={handleInputChange}
                placeholder="ABC-123"
                className="input text-center text-2xl font-mono tracking-wider"
                maxLength={7}
                autoFocus
                disabled={isLoading}
              />
              <p className="mt-2 text-xs text-slate-500 text-center">
                Format: ABC-123 (6 characters)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !joinCode.trim()}
              className="w-full btn btn-secondary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Joining...
                </span>
              ) : (
                'Join Session'
              )}
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-slate-600">
          <p>Don't have a code?</p>
          <button
            onClick={() => navigate('/create')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Create a new session
          </button>
        </div>
      </div>
    </div>
  );
}
