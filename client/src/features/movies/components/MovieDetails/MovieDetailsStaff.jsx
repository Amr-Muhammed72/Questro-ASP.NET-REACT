import { memo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

const StaffCard = ({ person }) => {
  const [imgError, setImgError] = useState(false);
  const showFallback = !person.profileUrl || imgError;

  return (
    <div className="flex-shrink-0 w-36 md:w-44 lg:w-48 flex flex-col group cursor-pointer transition-all duration-300">
      <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-zinc-800 flex items-center justify-center ring-1 ring-white/10 shadow-lg relative">
        {!showFallback ? (
          <img 
            src={person.profileUrl} 
            alt={person.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <User className="w-16 h-16 text-zinc-600 group-hover:scale-110 transition-transform duration-500" />
        )}
      </div>
      <h5 className="text-base lg:text-lg font-bold text-white line-clamp-1">{person.name}</h5>
      <p className="text-sm lg:text-base text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
        {person.role || person.department || 'Staff'}
      </p>
    </div>
  );
};

const MovieDetailsStaff = memo(({ movie }) => {
  const { cast = [], crew = [] } = movie || {};

  const topStaff = [
    ...cast.slice(0, 10),
    ...crew.filter(c => c.department === 'Directing' || c.department === 'Production').slice(0, 5)
  ];

  const scrollRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const syncScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setIsAtStart(scrollLeft <= 5);
    setIsAtEnd(Math.ceil(scrollLeft) >= scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    syncScrollState();
    window.addEventListener('resize', syncScrollState);
    return () => window.removeEventListener('resize', syncScrollState);
  }, [topStaff]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 240;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (topStaff.length === 0) return null;

  return (
    <div className="glassmorphism relative rounded-3xl py-8 md:py-10 shadow-2xl group transition-all duration-500 hover:glow-sm border border-white/5 bg-zinc-900/40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="relative z-10 flex items-center justify-between mb-8 px-8 md:px-10">
        <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md">Top Cast & Crew</h3>
      </div>
      
      <div className="group/slider flex items-center w-full">
        {/* Left Button */}
        <div className="w-12 sm:w-16 md:w-20 shrink-0 flex items-center justify-center">
          <button 
            className={`flex h-20 w-10 lg:h-24 lg:w-12 cursor-pointer items-center justify-center rounded-xl bg-zinc-800/90 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 ${
              isAtStart ? 'invisible' : 'visible'
            }`}
            onClick={() => scroll('left')}
            disabled={isAtStart}
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
        </div>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={syncScrollState}
          className="flex-1 flex flex-nowrap gap-4 md:gap-5 overflow-x-auto overflow-y-visible scroll-smooth snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {topStaff.map((person, idx) => (
            <div key={`${person.name}-${idx}`} className="snap-start shrink-0">
              <StaffCard person={person} />
            </div>
          ))}
        </div>

        {/* Right Button */}
        <div className="w-12 sm:w-16 md:w-20 shrink-0 flex items-center justify-center">
          <button 
            className={`flex h-20 w-10 lg:h-24 lg:w-12 cursor-pointer items-center justify-center rounded-xl bg-zinc-800/90 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 ${
              isAtEnd ? 'invisible' : 'visible'
            }`}
            onClick={() => scroll('right')}
            disabled={isAtEnd}
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
});

MovieDetailsStaff.displayName = 'MovieDetailsStaff';
export default MovieDetailsStaff;
