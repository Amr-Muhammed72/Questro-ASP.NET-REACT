import { lazy, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMovieDetails } from '../features/movies/hooks/useMovieDetails';

import MovieDetailsSkeleton from '../features/movies/components/MovieDetails/MovieDetailsSkeleton';
import MovieDetailsHero from '../features/movies/components/MovieDetails/MovieDetailsHero';
import MovieDetailsActions from '../features/movies/components/MovieDetails/MovieDetailsActions';
import MovieDetailsSummary from '../features/movies/components/MovieDetails/MovieDetailsSummary';
import LazyLoadWrapper from '../features/movies/components/MovieDetails/LazyLoadWrapper';
import NavBar from '../components/layout/NavBar';

const MovieDetailsStaff = lazy(() => import('../features/movies/components/MovieDetails/MovieDetailsStaff'));
const MovieDetailsReviews = lazy(() => import('../features/movies/components/MovieDetails/MovieDetailsReviews'));

export default function MovieDetailsPage() {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const { data: movie, isLoading, isError } = useMovieDetails(tmdbId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tmdbId]);

  if (isLoading) {
    return <MovieDetailsSkeleton />;
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
          <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-2xl">
            <span className="text-4xl">🎬</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Movie Unavailable</h2>
            <p className="text-zinc-400 max-w-md mx-auto">
              We couldn't load the details for this title. It might have been removed or the server is temporarily unreachable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <NavBar />
      
      <div className="relative">
        <MovieDetailsHero movie={movie} />
      </div>

      <main className="w-full px-4 md:px-8 lg:px-12 xl:px-16 pt-16 md:pt-24 pb-32 space-y-16 md:space-y-24">
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
              <MovieDetailsReviews movieId={movie.tmdbId} userRating={movie.userStatus?.rating} />
            </LazyLoadWrapper>
        </div>
      </main>
    </div>
  );
}