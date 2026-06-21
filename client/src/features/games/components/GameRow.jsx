import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import GameCard from './GameCard'; 
import CategoryHeader from '../../movies/components/CategoryHeader';

export default function GameRow({ title = '', games = [], onTitleClick }) {
  const displayGames = games.slice(0, 10);
  const rowRef = useRef(null);
  const rafRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const syncScrollState = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setIsAtStart(scrollLeft <= 5);
    setIsAtEnd(Math.ceil(scrollLeft) >= scrollWidth - clientWidth - 5);
  };

  const handleRowScroll = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      syncScrollState();
      rafRef.current = null;
    });
  };

  useEffect(() => {
    syncScrollState();
    window.addEventListener('resize', syncScrollState);
    return () => window.removeEventListener('resize', syncScrollState);
  }, [games]);

  const handleArrowScroll = (direction) => {
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

      <div className="group/slider flex items-center w-full">
        <div className="w-10 sm:w-12 md:w-16 shrink-0 flex items-center justify-center">
          <button 
            className={`flex h-16 w-8 cursor-pointer items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 ${
              isAtStart ? 'invisible' : 'visible'
            }`}
            onClick={() => handleArrowScroll('left')}
            disabled={isAtStart}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        </div>

        <div
          ref={rowRef}
          onScroll={handleRowScroll}
          className="flex-1 flex flex-nowrap overflow-x-auto overflow-y-visible gap-3 sm:gap-4 md:gap-5 scroll-smooth snap-x snap-mandatory py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {displayGames.map((game, index) => (
            <div key={game.rawgId || game.gameId || index} className="snap-start shrink-0">
               <GameCard game={game} isRowItem={true} />
            </div>
          ))}
        </div>

        <div className="w-10 sm:w-12 md:w-16 shrink-0 flex items-center justify-center">
          <button 
            className={`flex h-16 w-8 cursor-pointer items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 ${
              isAtEnd ? 'invisible' : 'visible'
            }`}
            onClick={() => handleArrowScroll('right')}
            disabled={isAtEnd}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}