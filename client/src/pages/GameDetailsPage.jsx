import { lazy, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

import GameRow from '../features/games/components/GameRow';

import GameDetailsHero from '../features/games/components/GameDetails/GameDetailsHero';
import GameDetailsSummary from '../features/games/components/GameDetails/GameDetailsSummary';
import GameDetailsSkeleton from '../features/games/components/GameDetails/GameDetailsSkeleton';
import LazyLoadWrapper from '../features/movies/components/MovieDetails/LazyLoadWrapper';

const GameDetailsReviews = lazy(() => import('../features/games/components/GameDetails/GameDetailsReviews'));

import { gameService } from '../features/games/api/gameService';
export default function GameDetailsPage() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const lastFetchedRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchKey = `${id}-${retryCount}`;
    if (lastFetchedRef.current === fetchKey) return;
    lastFetchedRef.current = fetchKey;
    
    const fetchGameDetails = async () => {
      try {
        setIsError(false);
        setIsLoading(true);
        const data = await gameService.getGameDetails(id);
        setGame(data);
        setSimilarGames(data.similarGames || []);
      } catch (error) {
        console.error('Failed to fetch game details:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameDetails();
    
  }, [id, retryCount]);

  if (isLoading) {
    return <GameDetailsSkeleton />;
  }

  if (isError || !game) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col">
        
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
          <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-2xl mb-4">
            <span className="text-4xl">🎮</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">Game Unavailable</h2>
            <p className="text-zinc-400 max-w-md mx-auto">
              We couldn't load the details for this title. It might have been removed or the server is temporarily unreachable.
            </p>
            <button 
              onClick={() => setRetryCount(prev => prev + 1)}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      
      
      <div className="relative">
        <GameDetailsHero game={game} />
      </div>

      <main className="relative z-20 w-full px-4 md:px-8 lg:px-12 xl:px-16 -mt-8 md:-mt-24 lg:-mt-32 pb-32 space-y-12 md:space-y-24">
        <div className="max-w-screen-2xl mx-auto space-y-12 md:space-y-24">
            <GameDetailsSummary game={game} />
            
            {/* Lazy Loaded Sections */}
            <LazyLoadWrapper threshold={0.1} fallback={
              <div className="h-64 animate-pulse bg-zinc-900 rounded-xl" />
            }>
              <GameDetailsReviews gameId={game.rawgId} />
            </LazyLoadWrapper>

            {similarGames.length > 0 && (
              <LazyLoadWrapper threshold={0.1} fallback={
                <div className="h-64 animate-pulse bg-zinc-900 rounded-xl" />
              }>
                <div className="mt-8 border-t border-white/5 pt-12">
                  <GameRow title="Similar Games" games={similarGames} />
                </div>
              </LazyLoadWrapper>
            )}
        </div>
      </main>
    </div>
  );
}
