import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, Location } from '@eatout/shared';
import { useUserId } from '../hooks/useUserId';

export function CreateSessionPage() {
  const navigate = useNavigate();
  const userId = useUserId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5000); // Default 5km

  const handleGetLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Step 1: Requesting location permission...');

      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      console.log('Step 2: Got location:', position.coords.latitude, position.coords.longitude);

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radius: radius,
      };

      console.log('Step 3: Creating session in Firebase...');

      // Create session
      const session = await createSession(userId, location);

      console.log('Step 4: Session created:', session.id);

      // Navigate to session page
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      console.error('Error creating session:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });

      if (err.code === 1) {
        setError('Location permission denied. Please enable location access to continue.');
      } else if (err.code === 2) {
        setError('Location unavailable. Please check your device settings.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError(`Failed to create session: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
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
            Create Session
          </h1>
          <p className="text-slate-600">
            We'll use your location to find nearby restaurants
          </p>
        </div>

        {/* Main Card */}
        <div className="card space-y-6">
          {/* Location Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>

          {/* Distance Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              How far are you willing to travel?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRadius(1609)} // 1 mile
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  radius === 1609
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1 mi
              </button>
              <button
                type="button"
                onClick={() => setRadius(8047)} // 5 miles
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  radius === 8047
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                5 mi
              </button>
              <button
                type="button"
                onClick={() => setRadius(16093)} // 10 miles
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  radius === 16093
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                10 mi
              </button>
              <button
                type="button"
                onClick={() => setRadius(24140)} // 15 miles
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  radius === 24140
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                15 mi
              </button>
              <button
                type="button"
                onClick={() => setRadius(32187)} // 20 miles
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  radius === 32187
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                20 mi
              </button>
              <button
                type="button"
                onClick={() => setRadius(48280)} // 30 miles
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  radius === 48280
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                30 mi
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-slate-600">
                Get a shareable link to invite your group
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-slate-600">
                Session lasts 24 hours
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleGetLocation}
            disabled={isLoading}
            className="w-full btn btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Creating Session...
              </span>
            ) : (
              'Get My Location & Create Session'
            )}
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-center text-slate-500">
          Your location is only used to find nearby restaurants and is not stored or shared.
        </p>
      </div>
    </div>
  );
}
