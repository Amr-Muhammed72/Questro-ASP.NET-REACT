import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import MovieCard from '../cards/MovieCard';

export const MOVIE_ROW_MOCK_DATA = [
  {
    id: 1,
    title: 'Thrash',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=720&q=80&auto=format&fit=crop',
    top10Rank: 1,
    recentlyAdded: true,
  },
  {
    id: 2,
    title: "What's Wrong?",
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=720&q=80&auto=format&fit=crop',
    top10Rank: 2,
    recentlyAdded: true,
  },
  {
    id: 3,
    title: 'Sons of Rizk 3',
    imageUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=720&q=80&auto=format&fit=crop',
    top10Rank: 3,
  },
  {
    id: 4,
    title: 'Siko Siko',
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=720&q=80&auto=format&fit=crop',
    top10Rank: 4,
  },
  {
    id: 5,
    title: 'Abigail',
    imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=720&q=80&auto=format&fit=crop',
  },
  {
    id: 6,
    title: 'War Machine',
    imageUrl: 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=720&q=80&auto=format&fit=crop',
  },
  {
    id: 7,
    title: 'Thrash',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=720&q=80&auto=format&fit=crop',
    top10Rank: 1,
    recentlyAdded: true,
  },
  {
    id: 8,
    title: "What's Wrong?",
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=720&q=80&auto=format&fit=crop',
    top10Rank: 2,
    recentlyAdded: true,
  },
  {
    id: 9,
    title: 'Sons of Rizk 3',
    imageUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=720&q=80&auto=format&fit=crop',
    top10Rank: 3,
  },
  {
    id: 10,
    title: 'Siko Siko',
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=720&q=80&auto=format&fit=crop',
    top10Rank: 4,
  },
  {
    id: 11,
    title: 'Abigail',
    imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=720&q=80&auto=format&fit=crop',
  },
  {
    id: 12,
    title: 'War Machine',
    imageUrl: 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=720&q=80&auto=format&fit=crop',
  },
];

export default function MovieRow({ title = 'Featured', movies = MOVIE_ROW_MOCK_DATA }) {
  const rowRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const syncScrollState = () => {
    if (!rowRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    const maxScrollLeft = scrollWidth - clientWidth;

    setIsAtStart(scrollLeft <= 5);
    setIsAtEnd(maxScrollLeft - scrollLeft <= 5);
  };

  useEffect(() => {
    syncScrollState();
    window.addEventListener('resize', syncScrollState);
    return () => {
      window.removeEventListener('resize', syncScrollState);
    };
  }, [movies]);

  const handleScroll = (direction) => {
    if (!rowRef.current) {
      return;
    }

    const scrollAmount = rowRef.current.clientWidth * 0.8;
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;

    rowRef.current.scrollBy({
      left: delta,
      behavior: 'smooth',
    });
  };

  return (
  <section className="group/row relative mb-8 text-white">
    <h2 className="mb-2 ml-4 sm:ml-8 md:ml-12 lg:ml-16 text-xl font-bold text-[#E5E5E5] sm:mb-4 sm:text-2xl md:text-3xl">
      {title}
    </h2>
    
    <div className="relative group/slider px-4 sm:px-8 md:px-12 lg:px-16">
      <div 
        className={`absolute left-0 top-0 bottom-0 z-30 flex w-8 sm:w-10 md:w-12 lg:w-16 cursor-pointer items-center justify-center bg-black/30 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 hover:bg-black/50 group-hover/slider:opacity-100 hidden md:flex ${isAtStart ? 'hidden opacity-0 pointer-events-none group-hover/slider:opacity-0' : ''}`}
        onClick={() => handleScroll('left')}
      >
        <div className="flex h-16 w-8 items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white">
          <ChevronLeft className="h-6 w-6 text-white" />
        </div>
      </div>

      <div
        ref={rowRef}
        onScroll={syncScrollState}
        className="flex flex-nowrap overflow-x-auto overflow-y-visible gap-2 scroll-smooth snap-x snap-mandatory pt-4 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {movies.map((movie) => (
          <div key={movie.id} className="snap-start shrink-0">
             <MovieCard movie={movie} />
          </div>
        ))}
      </div>

      <div 
        className={`absolute right-0 top-0 bottom-0 z-30 flex w-8 sm:w-10 md:w-12 lg:w-16 cursor-pointer items-center justify-center bg-black/30 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 hover:bg-black/50 group-hover/slider:opacity-100 hidden md:flex ${isAtEnd ? 'hidden opacity-0 pointer-events-none group-hover/slider:opacity-0' : ''}`}
        onClick={() => handleScroll('right')}
      >
        <div className="flex h-16 w-8 items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white">
          <ChevronRight className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  </section>
);
}