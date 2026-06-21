import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import CategoryHeader from './CategoryHeader';

export default function MovieRow({ title = 'Featured', movies = [], onTitleClick }) {
  const displayMovies = movies;
  const rowRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const syncScrollState = () => {
    if (!rowRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setIsAtStart(scrollLeft <= 5);
    setIsAtEnd(Math.ceil(scrollLeft) >= scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    syncScrollState();
    window.addEventListener('resize', syncScrollState);
    return () => window.removeEventListener('resize', syncScrollState);
  }, [movies]);

  const handleScroll = (direction) => {
    if (!rowRef.current) return;
    const scrollAmount = 140;
    rowRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="group/row mb-8 text-white w-full">
      {title && <CategoryHeader title={title} onTitleClick={onTitleClick} />}

      <div className="group/slider flex items-center w-[calc(100%+2rem)] -ml-4 md:w-full md:ml-0">
        <div className="hidden md:flex w-12 md:w-16 shrink-0 items-center justify-center">
          <button 
            className={`flex h-16 w-8 cursor-pointer items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 ${
              isAtStart ? 'invisible' : 'visible'
            }`}
            onClick={() => handleScroll('left')}
            disabled={isAtStart}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        </div>

        <div
          ref={rowRef}
          onScroll={syncScrollState}
          className="flex-1 flex flex-nowrap overflow-x-auto overflow-y-visible gap-3 sm:gap-4 md:gap-5 scroll-smooth snap-x snap-mandatory py-4 px-4 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {displayMovies.map((movie, index) => (
            <div key={movie.tmdbId || movie.id || index} className="snap-start shrink-0">
               <MovieCard movie={movie} isRowItem={true} />
            </div>
          ))}
          {/* Spacer to allow the last item to scroll past padding on mobile */}
          <div className="w-1 shrink-0 md:hidden"></div>
        </div>

        <div className="hidden md:flex w-12 md:w-16 shrink-0 items-center justify-center">
          <button 
            className={`flex h-16 w-8 cursor-pointer items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 ${
              isAtEnd ? 'invisible' : 'visible'
            }`}
            onClick={() => handleScroll('right')}
            disabled={isAtEnd}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}