import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getSession,
  subscribeToSession,
  subscribeToSessionResponses,
  searchNearbyRestaurants,
  eliminateCuisine,
  unEliminateCuisine,
  eliminateVenue,
  unEliminateVenue,
  eliminateRestaurant,
  unEliminateRestaurant,
  updateStage,
  getUserResponse,
  calculateGroupStatistics,
  Session,
  Restaurant,
  UserResponse,
  GroupStatistics,
  formatJoinCode,
  CUISINE_CATEGORIES,
  VENUE_CATEGORIES,
  PredefinedCategory,
} from '@eatout/shared';
import { useUserId } from '../hooks/useUserId';
import { CategoryCard } from '../components/CategoryCard';
import { RestaurantCard } from '../components/RestaurantCard';
import { ShareButton } from '../components/ShareButton';
import { ProgressSteps } from '../components/ProgressBar';

type Stage = 'cuisines' | 'venues' | 'restaurants' | 'complete';

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const userId = useUserId();

  const [session, setSession] = useState<Session | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [userResponse, setUserResponse] = useState<UserResponse | null>(null);
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage>('cuisines');
  const [restaurantBatchOffset, setRestaurantBatchOffset] = useState(0); // Track which batch of 25 we're showing
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.adminId === userId;

  // Load session and subscribe to updates
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const loadSession = async () => {
      try {
        const sessionData = await getSession(sessionId);
        if (!sessionData) {
          setError('Session not found');
          return;
        }

        setSession(sessionData);

        // Load user's response
        const userResponseData = await getUserResponse(sessionId, userId);
        setUserResponse(userResponseData);
        setCurrentStage(userResponseData?.currentStage || 'cuisines');

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session');
        setIsLoading(false);
      }
    };

    loadSession();

    // Subscribe to session updates
    const unsubscribeSession = subscribeToSession(sessionId, (sessionData) => {
      if (sessionData) {
        setSession(sessionData);
      }
    });

    // Subscribe to responses
    const unsubscribeResponses = subscribeToSessionResponses(
      sessionId,
      (responsesData) => {
        setResponses(responsesData);
        // Update user's response
        const currentUserResponse = responsesData.find((r) => r.userId === userId);
        if (currentUserResponse) {
          setUserResponse(currentUserResponse);
          setCurrentStage(currentUserResponse.currentStage);
        }
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeResponses();
    };
  }, [sessionId, userId, navigate]);

  // Calculate statistics whenever responses change
  useEffect(() => {
    if (!sessionId) return;

    const updateStats = async () => {
      const stats = await calculateGroupStatistics(sessionId);
      setStatistics(stats);
    };

    updateStats();
  }, [responses, sessionId]);

  // Load restaurants when entering restaurants stage
  useEffect(() => {
    if (currentStage === 'restaurants' && restaurants.length === 0 && session && userResponse) {
      const loadRestaurants = async () => {
        // Calculate which types have NOT been eliminated by this user
        const allCuisines = CUISINE_CATEGORIES.map(cat => cat.type);
        const allVenues = VENUE_CATEGORIES.map(cat => cat.type);
        const viableTypes = [
          ...allCuisines.filter(type => !userResponse.eliminatedCuisines.includes(type)),
          ...allVenues.filter(type => !userResponse.eliminatedVenues.includes(type)),
        ];

        console.log('Loading restaurants for stage 3...', {
          location: session.location,
          radius: session.location.radius,
          viableTypes: viableTypes.length,
        });

        setIsLoadingRestaurants(true);
        try {
          // Search for non-eliminated types
          const restaurantsData = await searchNearbyRestaurants({
            location: session.location,
            radius: session.location.radius,
            types: viableTypes.length > 0 ? viableTypes : undefined,
          });
          console.log('Restaurants loaded:', restaurantsData.length, 'unique restaurants found');

          // Log sample of types to debug cuisine filtering
          console.log('Sample restaurant types:', restaurantsData.slice(0, 5).map(r => ({
            name: r.name,
            types: r.types
          })));

          // Filter out restaurants that have eliminated cuisine OR venue types
          const filteredRestaurants = restaurantsData.filter(restaurant => {
            if (!restaurant.types) return true;

            // Check if restaurant has any eliminated cuisine types
            const hasEliminatedCuisine = restaurant.types.some(type =>
              userResponse.eliminatedCuisines.includes(type)
            );

            // Check if restaurant has any eliminated venue types
            const hasEliminatedVenue = restaurant.types.some(type =>
              userResponse.eliminatedVenues.includes(type)
            );

            return !hasEliminatedCuisine && !hasEliminatedVenue;
          });

          console.log('After cuisine + venue filtering:', filteredRestaurants.length, 'restaurants remain');
          setRestaurants(filteredRestaurants);
        } catch (err) {
          console.error('Error loading restaurants:', err);
        } finally {
          setIsLoadingRestaurants(false);
        }
      };

      loadRestaurants();
    }
  }, [currentStage, restaurants.length, session, userResponse]);

  const handleAdvanceStage = async () => {
    if (!sessionId) return;

    const stages: Stage[] = ['cuisines', 'venues', 'restaurants', 'complete'];
    const currentIndex = stages.indexOf(currentStage);
    const nextStage = stages[currentIndex + 1];

    if (nextStage) {
      await updateStage(sessionId, userId, nextStage);
      setCurrentStage(nextStage);
      // Scroll to top when advancing to next stage
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStageClick = async (stage: Stage) => {
    if (!sessionId) return;
    await updateStage(sessionId, userId, stage);
    setCurrentStage(stage);
    // Scroll to top when clicking a stage
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if all restaurants in current batch are eliminated, load next batch
  useEffect(() => {
    if (currentStage !== 'restaurants' || !statistics || restaurants.length === 0) return;

    const currentBatch = restaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 25);
    if (currentBatch.length === 0) return;

    // Get all eliminated restaurant IDs from all users
    const allEliminatedRestaurants = new Set<string>();
    responses.forEach(response => {
      response.eliminatedRestaurants?.forEach(placeId => {
        allEliminatedRestaurants.add(placeId);
      });
    });

    // Check if all in current batch are eliminated
    const allEliminated = currentBatch.every(restaurant =>
      allEliminatedRestaurants.has(restaurant.place_id)
    );

    if (allEliminated && restaurantBatchOffset + 25 < restaurants.length) {
      console.log('All restaurants eliminated, loading next batch...');
      setRestaurantBatchOffset(prev => prev + 25);
    }
  }, [currentStage, statistics, responses, restaurants, restaurantBatchOffset]);

  const handleToggleCuisine = async (type: string) => {
    if (!sessionId) return;

    const isEliminated = userResponse?.eliminatedCuisines.includes(type) || false;

    try {
      if (isEliminated) {
        await unEliminateCuisine(sessionId, userId, type);
      } else {
        await eliminateCuisine(sessionId, userId, type);
      }
    } catch (err) {
      console.error('Error toggling cuisine elimination:', err);
    }
  };

  const handleToggleVenue = async (type: string) => {
    if (!sessionId) return;

    const isEliminated = userResponse?.eliminatedVenues.includes(type) || false;

    try {
      if (isEliminated) {
        await unEliminateVenue(sessionId, userId, type);
      } else {
        await eliminateVenue(sessionId, userId, type);
      }
    } catch (err) {
      console.error('Error toggling venue elimination:', err);
    }
  };

  const handleToggleRestaurant = async (placeId: string) => {
    if (!sessionId) return;

    const isEliminated = userResponse?.eliminatedRestaurants.includes(placeId) || false;

    try {
      if (isEliminated) {
        await unEliminateRestaurant(sessionId, userId, placeId);
      } else {
        await eliminateRestaurant(sessionId, userId, placeId);
      }
    } catch (err) {
      console.error('Error toggling restaurant elimination:', err);
    }
  };

  const handleShare = async () => {
    if (!session || !sessionId) return;

    const shareUrl = `${window.location.origin}/session/${sessionId}`;
    const shareText = `Help us pick a restaurant! Join my EatOut session and start eliminating options:\n\nCode: ${formatJoinCode(session.joinCode)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Help Pick a Restaurant!',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{error || 'Session Not Found'}</h2>
          <p className="text-slate-600">
            This session may have expired or the link is invalid.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const eliminatedCuisinesCount = userResponse?.eliminatedCuisines.length || 0;
  const eliminatedVenuesCount = userResponse?.eliminatedVenues.length || 0;
  const eliminatedRestaurantsCount = userResponse?.eliminatedRestaurants.length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-600 hover:text-slate-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <ShareButton onClick={handleShare} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Code: {formatJoinCode(session.joinCode)}
              </h1>
              <p className="text-sm text-slate-600">
                {statistics?.participantCount || 0} {statistics?.participantCount === 1 ? 'person' : 'people'} voting
              </p>
            </div>
            {isAdmin && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                Admin
              </span>
            )}
          </div>

          {/* Progress Steps */}
          <div>
            <ProgressSteps currentStage={currentStage} onStageClick={handleStageClick} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {currentStage === 'cuisines' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Step 1: Eliminate Cuisines
              </h2>
              <p className="text-slate-600 text-lg">
                Tap what you <strong>DON'T</strong> want to eat 🚫
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {eliminatedCuisinesCount} of {CUISINE_CATEGORIES.length} eliminated
              </p>
            </div>

            {/* Cuisine Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {CUISINE_CATEGORIES.map((category: PredefinedCategory) => {
                const groupEliminationCount = statistics?.cuisineEliminationCounts[category.type] || 0;
                const isEliminated = (userResponse?.eliminatedCuisines.includes(category.type) || false) || groupEliminationCount > 0;

                return (
                  <CategoryCard
                    key={category.type}
                    category={category}
                    isEliminated={isEliminated}
                    eliminationCount={groupEliminationCount}
                    totalParticipants={statistics?.participantCount || 0}
                    onToggle={() => handleToggleCuisine(category.type)}
                  />
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={handleAdvanceStage}
                className="btn btn-primary btn-lg"
              >
                Continue to Venues →
              </button>
            </div>
          </div>
        )}

        {currentStage === 'venues' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Step 2: Eliminate Venue Types
              </h2>
              <p className="text-slate-600 text-lg">
                Tap the types of places you <strong>DON'T</strong> want 🚫
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {eliminatedVenuesCount} of {VENUE_CATEGORIES.length} eliminated
              </p>
            </div>

            {/* Venue Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {VENUE_CATEGORIES.map((category: PredefinedCategory) => {
                const groupEliminationCount = statistics?.venueEliminationCounts[category.type] || 0;
                const isEliminated = (userResponse?.eliminatedVenues.includes(category.type) || false) || groupEliminationCount > 0;

                return (
                  <CategoryCard
                    key={category.type}
                    category={category}
                    isEliminated={isEliminated}
                    eliminationCount={groupEliminationCount}
                    totalParticipants={statistics?.participantCount || 0}
                    onToggle={() => handleToggleVenue(category.type)}
                  />
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={handleAdvanceStage}
                className="btn btn-primary btn-lg"
              >
                Continue to Restaurants →
              </button>
            </div>
          </div>
        )}

        {currentStage === 'restaurants' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Step 3: Eliminate Restaurants
              </h2>
              <p className="text-slate-600 text-lg">
                Tap what you <strong>DON'T</strong> want to eat 🚫
              </p>
              {!isLoadingRestaurants && (
                <p className="text-sm text-slate-500 mt-2">
                  {restaurants.length} restaurants found • {eliminatedRestaurantsCount} eliminated
                </p>
              )}
            </div>

            {isLoadingRestaurants ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Finding restaurants...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {restaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 25).map((restaurant) => {
                  const groupEliminationCount = statistics?.restaurantEliminationCounts[restaurant.place_id] || 0;
                  const isEliminated = (userResponse?.eliminatedRestaurants.includes(restaurant.place_id) || false) || groupEliminationCount > 0;

                  return (
                    <RestaurantCard
                      key={restaurant.place_id}
                      restaurant={restaurant}
                      isEliminated={isEliminated}
                      eliminationCount={groupEliminationCount}
                      totalParticipants={statistics?.participantCount || 0}
                      onToggle={() => handleToggleRestaurant(restaurant.place_id)}
                    />
                  );
                })}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleAdvanceStage}
                className="btn btn-primary btn-lg"
              >
                See Final Results →
              </button>
            </div>
          </div>
        )}

        {currentStage === 'complete' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                🎉 Final Results
              </h2>
              <p className="text-slate-600 text-lg">
                Here are the restaurants that survived elimination!
              </p>
              {(() => {
                // Get the current batch of 25 restaurants shown in Step 3
                const step3Restaurants = restaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 25);

                // Get all eliminated restaurant IDs from all users
                const allEliminatedRestaurants = new Set<string>();
                responses.forEach(response => {
                  response.eliminatedRestaurants?.forEach(placeId => {
                    allEliminatedRestaurants.add(placeId);
                  });
                });

                // Filter to only show non-eliminated restaurants from Step 3
                const finalRestaurants = step3Restaurants.filter(
                  restaurant => !allEliminatedRestaurants.has(restaurant.place_id)
                );

                return (
                  <p className="text-sm text-slate-500 mt-2">
                    {finalRestaurants.length} restaurants remaining from {step3Restaurants.length} options
                  </p>
                );
              })()}
            </div>

            {(() => {
              // Get the current batch of 25 restaurants shown in Step 3
              const step3Restaurants = restaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 25);

              // Get all eliminated restaurant IDs from all users
              const allEliminatedRestaurants = new Set<string>();
              responses.forEach(response => {
                response.eliminatedRestaurants?.forEach(placeId => {
                  allEliminatedRestaurants.add(placeId);
                });
              });

              // Filter to only show non-eliminated restaurants from Step 3
              const finalRestaurants = step3Restaurants.filter(
                restaurant => !allEliminatedRestaurants.has(restaurant.place_id)
              );

              if (finalRestaurants.length === 0) {
                return (
                  <div className="card text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No Restaurants Left!
                    </h3>
                    <p className="text-slate-600">
                      You eliminated everything! Go back and remove some eliminations.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {finalRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.place_id}
                      restaurant={restaurant}
                      isEliminated={false}
                      eliminationCount={0}
                      totalParticipants={0}
                      onToggle={() => {}}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
