import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import CategoryHeader from './CategoryHeader';

export default function MovieRow({ title = 'Featured', movies = [], onTitleClick }) {
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
      <CategoryHeader title={title} onTitleClick={onTitleClick} />
      {/* Flex container holds buttons and slider side-by-side */}
      <div className="group/slider flex items-center w-full">
        {/* Left Button Space (Fixed width, shrinks to 0 on tiny screens if needed) */}
        <div className="w-10 sm:w-12 md:w-16 shrink-0 flex items-center justify-center">
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

        {/* Scroll Container (Takes remaining space in the middle) */}
        <div
          ref={rowRef}
          onScroll={syncScrollState}
          className="flex-1 flex flex-nowrap overflow-x-auto overflow-y-visible gap-3 sm:gap-4 md:gap-5 scroll-smooth snap-x snap-mandatory py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {movies.map((movie, index) => (
            <div key={movie.tmdbId || movie.id || index} className="snap-start shrink-0">
               <MovieCard movie={movie} isRowItem={true} />
            </div>
          ))}
        </div>

        <div className="w-10 sm:w-12 md:w-16 shrink-0 flex items-center justify-center">
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