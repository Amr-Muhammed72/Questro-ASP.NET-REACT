import { lazy, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMovieDetails } from '../features/movies/hooks/useMovieDetails';

import MovieDetailsSkeleton from '../features/movies/components/MovieDetails/MovieDetailsSkeleton';
import MovieDetailsHero from '../features/movies/components/MovieDetails/MovieDetailsHero';
import MovieDetailsActions from '../features/movies/components/MovieDetails/MovieDetailsActions';
import MovieDetailsSummary from '../features/movies/components/MovieDetails/MovieDetailsSummary';
import LazyLoadWrapper from '../features/movies/components/MovieDetails/LazyLoadWrapper';

import MovieRow from '../features/movies/components/MovieRow';

const MovieDetailsStaff = lazy(() => import('../features/movies/components/MovieDetails/MovieDetailsStaff'));
const MovieDetailsReviews = lazy(() => import('../features/movies/components/MovieDetails/MovieDetailsReviews'));

export default function MovieDetailsPage() {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const { data: movie, isLoading, isError, refetch } = useMovieDetails(tmdbId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tmdbId]);

  if (isLoading) {
    return <MovieDetailsSkeleton />;
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col">
        
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
          <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-2xl mb-4">
            <span className="text-4xl">🎬</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">Movie Unavailable</h2>
            <p className="text-zinc-400 max-w-md mx-auto">
              We couldn't load the details for this title. It might have been removed or the server is temporarily unreachable.
            </p>
            <button 
              onClick={() => refetch()}
              className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20 inline-flex items-center gap-2"
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
        <MovieDetailsHero movie={movie} />
      </div>

      <main className="relative z-20 w-full px-4 md:px-8 lg:px-12 xl:px-16 -mt-16 md:-mt-24 lg:-mt-32 pb-32 space-y-16 md:space-y-24">
        <div className="max-w-screen-2xl mx-auto space-y-16 md:space-y-24">
            <MovieDetailsSummary movie={movie} />
            
            {/* Lazy Loaded Sections */}
            <LazyLoadWrapper threshold={0.1} fallback={
              <div className="h-64 animate-pulse bg-zinc-900 rounded-xl" />
            }>
              <MovieDetailsStaff movie={movie} />
            </LazyLoadWrapper>

            <LazyLoadWrapper threshold={0.1} fallback={
              <div className="h-64 animate-pulse bg-zinc-900 rounded-xl" />
            }>
              <MovieDetailsReviews movieId={movie.tmdbId} userRating={movie.userStatus?.userRating} />
            </LazyLoadWrapper>

            {movie.similarMovies && movie.similarMovies.length > 0 && (
              <LazyLoadWrapper threshold={0.1} fallback={
                <div className="h-64 animate-pulse bg-zinc-900 rounded-xl" />
              }>
                <div className="mt-8 border-t border-white/5 pt-12">
                  <MovieRow title="Similar Movies" movies={movie.similarMovies} />
                </div>
              </LazyLoadWrapper>
            )}
        </div>
      </main>
    </div>
  );
}
