import { useState, useEffect, useRef, useMemo } from 'react';
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
  storeRestaurantsInSession,
  lockInWinner,
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
  const [restaurantBatchOffset, setRestaurantBatchOffset] = useState(0); // Track which batch of 8 we're showing
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [isWaitingForOthers, setIsWaitingForOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already initiated restaurant loading for this session
  const restaurantLoadInitiated = useRef(false);

  // Filter restaurants based on eliminated cuisines and venues from all users
  const filteredRestaurants = useMemo(() => {
    // Get all eliminated cuisines and venues from ALL users
    const allEliminatedCuisines = new Set<string>();
    const allEliminatedVenues = new Set<string>();

    responses.forEach(response => {
      response.eliminatedCuisines?.forEach(type => allEliminatedCuisines.add(type));
      response.eliminatedVenues?.forEach(type => allEliminatedVenues.add(type));
    });

    // Calculate which cuisines are KEPT (not eliminated)
    const allCuisineTypes = new Set(CUISINE_CATEGORIES.map(c => c.type));
    const keptCuisines = new Set<string>();
    allCuisineTypes.forEach(type => {
      if (!allEliminatedCuisines.has(type)) {
        keptCuisines.add(type);
      }
    });

    // Two-step filtering process:
    // Step 1: Keep ONLY restaurants that have at least ONE kept cuisine type
    const afterCuisineFilter = restaurants.filter(restaurant => {
      const restaurantTypes = restaurant.types || [];
      // Restaurant must have at least one of the non-eliminated cuisine types
      return restaurantTypes.some(type => keptCuisines.has(type));
    });

    // Step 2: Filter by eliminated venues (only apply to cuisine survivors)
    const filtered = afterCuisineFilter.filter(restaurant => {
      const restaurantTypes = restaurant.types || [];
      const hasEliminatedVenue = restaurantTypes.some(type =>
        allEliminatedVenues.has(type)
      );
      return !hasEliminatedVenue; // Keep if no eliminated venue
    });

    if (restaurants.length > 0 && currentStage === 'restaurants') {
      console.log('🔍 Two-Step Restaurant Filtering:', {
        step1_total: restaurants.length,
        step1_keptCuisines: Array.from(keptCuisines),
        step1_afterCuisineFilter: afterCuisineFilter.length,
        step1_removedByCuisine: restaurants.length - afterCuisineFilter.length,
        step2_afterVenueFilter: filtered.length,
        step2_removedByVenue: afterCuisineFilter.length - filtered.length,
        finalTotal: filtered.length,
        totalRemoved: restaurants.length - filtered.length,
        eliminatedCuisines: Array.from(allEliminatedCuisines),
        eliminatedVenues: Array.from(allEliminatedVenues)
      });
    }

    return filtered;
  }, [restaurants, responses, currentStage]);

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
  // This now uses a centralized approach: fetch once and store in session
  useEffect(() => {
    // If session has restaurants already, use them
    if (currentStage === 'restaurants' && session?.restaurants) {
      console.log('Using stored restaurants from session:', session.restaurants.length);
      setRestaurants(session.restaurants);
      setIsLoadingRestaurants(false);
      setIsWaitingForOthers(false);
      return;
    }

    // Don't load if we're not on restaurants stage or if we've already initiated loading
    if (currentStage !== 'restaurants' || !session || restaurantLoadInitiated.current) {
      return;
    }

    const loadRestaurants = async () => {
      if (!sessionId) return;

      // Check if this is a solo session or if all users are ready
      // Use the real-time responses data instead of making a fresh query
      // Note: responses might not include current user yet if subscription hasn't fired
      const isSoloSession = responses.length <= 1; // <= to handle empty responses

      // For multi-user, check if all existing responses (excluding current user if not in list yet)
      // are at restaurants stage or beyond
      const otherUsersReady = responses.length === 0 || responses.every(
        response =>
          response.currentStage === 'restaurants' ||
          response.currentStage === 'complete'
      );

      console.log('Restaurant loading check:', {
        isSoloSession,
        otherUsersReady,
        responsesCount: responses.length,
        stages: responses.map(r => ({ userId: r.userId, stage: r.currentStage }))
      });

      if (isSoloSession || otherUsersReady) {
        // Mark that we've initiated loading to prevent duplicate requests
        restaurantLoadInitiated.current = true;

        // Load restaurants if solo OR all users are ready
        console.log('Loading restaurants for Step 3...');
        setIsLoadingRestaurants(true);
        setIsWaitingForOthers(false);

        try {
          // Fetch all restaurants in the area
          // We'll search for all types and let individual filtering happen client-side
          const restaurantsData = await searchNearbyRestaurants({
            location: session.location,
            radius: session.location.radius,
          });

          console.log('Restaurants loaded:', restaurantsData.length, 'unique restaurants found');

          // Slim down restaurant data to reduce Firestore document size
          // Firestore has a 1MB limit per document, so we only keep essential fields
          const slimRestaurants = restaurantsData.map(r => ({
            place_id: r.place_id,
            name: r.name,
            rating: r.rating,
            types: r.types,
            vicinity: r.vicinity,
          }));

          console.log('Storing slim restaurant data:', {
            original: JSON.stringify(restaurantsData).length,
            slimmed: JSON.stringify(slimRestaurants).length,
            reduction: `${Math.round((1 - JSON.stringify(slimRestaurants).length / JSON.stringify(restaurantsData).length) * 100)}%`
          });

          // Store restaurants in session so all users see the same list
          await storeRestaurantsInSession(sessionId, userId, slimRestaurants);
          console.log('Restaurants stored in session successfully');
        } catch (err) {
          console.error('Error loading restaurants:', err);
          setIsLoadingRestaurants(false);
          // Reset flag on error so they can try again
          restaurantLoadInitiated.current = false;
        }
      } else {
        // Multi-user session but not all users are ready
        console.log('Waiting for other users to complete Steps 1 & 2...');
        setIsWaitingForOthers(true);
        setIsLoadingRestaurants(false);
      }
    };

    loadRestaurants();
  }, [currentStage, session, sessionId, userId, responses]);

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

  const handleRevealWinner = async () => {
    if (!sessionId || !session) return;

    // Get the current batch of 8 restaurants shown in Step 3 (use filteredRestaurants)
    const step3Restaurants = filteredRestaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 8);

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
      setError('No restaurants left! Please go back and remove some eliminations.');
      return;
    }

    // Pick a random winner
    const winnerIndex = Math.floor(Math.random() * finalRestaurants.length);
    const winner = finalRestaurants[winnerIndex];

    console.log('Admin revealing winner:', winner.name);

    // Lock in the winner to the session
    await lockInWinner(sessionId, winner);

    // Winner will be shown via real-time subscription update
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
    if (currentStage !== 'restaurants' || !statistics || filteredRestaurants.length === 0) return;

    const currentBatch = filteredRestaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 8);
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

    if (allEliminated && restaurantBatchOffset + 8 < filteredRestaurants.length) {
      console.log('All restaurants eliminated, loading next batch...');
      setRestaurantBatchOffset(prev => prev + 8);
    }
  }, [currentStage, statistics, responses, filteredRestaurants, restaurantBatchOffset]);

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
              <h1 className="text-lg font-bold text-slate-900">
                Code: {formatJoinCode(session.joinCode)}
              </h1>
            </div>
            <ShareButton onClick={handleShare} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {currentStage === 'cuisines' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Step 1: Which cuisines are out?
              </h2>
            </div>

            {/* Cuisine Grid */}
            <div className="grid grid-cols-5 gap-2">
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

            <div className="text-center space-y-4">
              <button
                onClick={handleAdvanceStage}
                className="btn btn-primary btn-lg"
              >
                Continue to Venues →
              </button>
              {/* Progress Steps */}
              <div className="pt-2">
                <ProgressSteps currentStage={currentStage} onStageClick={handleStageClick} />
              </div>
            </div>
          </div>
        )}

        {currentStage === 'venues' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Step 2: Which venue types are out?
              </h2>
            </div>

            {/* Venue Grid */}
            <div className="grid grid-cols-5 gap-2">
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

            <div className="text-center space-y-4">
              <button
                onClick={handleAdvanceStage}
                className="btn btn-primary btn-lg"
              >
                Continue to Restaurants →
              </button>
              {/* Progress Steps */}
              <div className="pt-2">
                <ProgressSteps currentStage={currentStage} onStageClick={handleStageClick} />
              </div>
            </div>
          </div>
        )}

        {currentStage === 'restaurants' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Step 3: Which restaurants are out?
              </h2>
            </div>

            {isWaitingForOthers ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Waiting for other participants</p>
                <p className="text-slate-600">
                  Everyone needs to complete Steps 1 & 2 before we can load restaurants.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {statistics?.participantCount || 0} {statistics?.participantCount === 1 ? 'person' : 'people'} in session
                </p>
              </div>
            ) : isLoadingRestaurants ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading restaurants...</p>
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No restaurants found matching your preferences.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredRestaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 8).map((restaurant) => {
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

            <div className="text-center space-y-4">
              {/* Check if winner is already selected */}
              {session?.winner ? (
                <button
                  onClick={handleAdvanceStage}
                  className="btn btn-primary btn-lg"
                >
                  See Final Results →
                </button>
              ) : session?.adminId === userId ? (
                // Admin can reveal the winner
                <button
                  onClick={handleRevealWinner}
                  className="btn btn-primary btn-lg"
                >
                  🎉 Reveal Winner!
                </button>
              ) : (
                // Non-admin waits for host to reveal
                <div className="space-y-3">
                  <div className="text-lg text-slate-600">
                    ⏳ Waiting for host to reveal the winner...
                  </div>
                  <div className="text-sm text-slate-500">
                    The session host will select the final restaurant
                  </div>
                </div>
              )}
              {/* Progress Steps */}
              <div className="pt-2">
                <ProgressSteps currentStage={currentStage} onStageClick={handleStageClick} />
              </div>
            </div>
          </div>
        )}

        {currentStage === 'complete' && (
          <div className="space-y-6">
            {(() => {
              // Check if winner has been selected by admin
              if (!session?.winner) {
                // No winner yet - show waiting message
                return (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Waiting for Winner
                    </h2>
                    <p className="text-slate-600">
                      {session?.adminId === userId
                        ? "Go back to Step 3 and click 'Reveal Winner!' to select the final restaurant."
                        : "The session host will reveal the winner soon!"}
                    </p>
                  </div>
                );
              }

              // Winner has been selected - show it!
              const winner = session.winner;

              // Get the current batch of 8 restaurants shown in Step 3 (use filteredRestaurants, not raw restaurants)
              const step3Restaurants = filteredRestaurants.slice(restaurantBatchOffset, restaurantBatchOffset + 8);

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

              if (finalRestaurants.length === 0 && !session.winner) {
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

              // Google Maps link
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(winner.name)}&query_place_id=${winner.place_id}`;

              return (
                <div className="text-center space-y-6">
                  {/* Celebratory Header */}
                  <div className="space-y-2">
                    <div className="text-6xl">🎉🍽️🎊</div>
                    <h2 className="text-3xl font-bold text-primary-600">
                      We Have a Winner!
                    </h2>
                    <p className="text-lg text-slate-600">
                      Your group has chosen...
                    </p>
                  </div>

                  {/* Winner Card */}
                  <div className="card p-8 bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 shadow-xl max-w-lg mx-auto">
                    <h3 className="text-4xl font-bold text-slate-900 mb-4">
                      {winner.name}
                    </h3>

                    {winner.rating && (
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <svg className="w-6 h-6 fill-current text-yellow-500" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-2xl font-semibold text-slate-900">{winner.rating}</span>
                        <span className="text-slate-500">rating</span>
                      </div>
                    )}

                    {winner.vicinity && (
                      <p className="text-slate-600 mb-6">{winner.vicinity}</p>
                    )}

                    {/* Map it and go button */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-lg inline-flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Map it and go!
                    </a>
                  </div>

                  {finalRestaurants.length > 1 && (
                    <p className="text-sm text-slate-500">
                      {finalRestaurants.length} options survived - this one was randomly selected by the host!
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Progress Steps */}
            <div className="text-center pt-4">
              <ProgressSteps currentStage={currentStage} onStageClick={handleStageClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
