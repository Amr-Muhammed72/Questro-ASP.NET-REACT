import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const EditorialPosterGrid = ({ 
  items, 
  label = "Editorial Selection", 
  title = "Curated for Discovery" 
}) => {
  items = items ? [...items].sort(() => 0.5 - Math.random()) : [];
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, 8);

  const positions = [
    { gridCol: 'col-span-1 md:col-span-2 lg:col-span-2', gridRow: 'row-span-2 md:row-span-2 lg:row-span-2', scale: 1.1 },
    { gridCol: 'col-span-1 md:col-span-1 lg:col-span-1', gridRow: 'row-span-1 md:row-span-1 lg:row-span-1', scale: 0.9 },
    { gridCol: 'col-span-1 md:col-span-1 lg:col-span-1', gridRow: 'row-span-2 md:row-span-2 lg:row-span-2', scale: 1 },
    { gridCol: 'col-span-1 md:col-span-1 lg:col-span-1', gridRow: 'row-span-1 md:row-span-1 lg:row-span-1', scale: 0.95 },
    { gridCol: 'col-span-2 md:col-span-1 lg:col-span-1', gridRow: 'row-span-1 md:row-span-1 lg:row-span-1', scale: 0.85 },
    { gridCol: 'col-span-1 md:col-span-1 lg:col-span-1', gridRow: 'row-span-1 md:row-span-1 lg:row-span-1', scale: 0.9 },
    { gridCol: 'col-span-1 md:col-span-2 lg:col-span-1', gridRow: 'row-span-1 md:row-span-1 lg:row-span-1', scale: 1 },
    { gridCol: 'col-span-1 md:col-span-1 lg:col-span-1', gridRow: 'row-span-1 md:row-span-1 lg:row-span-1', scale: 0.95 },
  ];

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 180; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="relative w-full py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* UPDATED: Dynamic Section labels using props */}
        <div className="mb-12 text-center">
          <p className="text-sm md:text-base font-semibold text-indigo-400/80 uppercase tracking-widest mb-2">
            {label}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
            {title}
          </h2>
        </div>

        {/* Mobile: Horizontal Scrolling Carousel */}
        <div className="md:hidden group/slider flex items-center w-full -mx-2">
          
          <div className="w-10 shrink-0 flex items-center justify-center z-10">
            <button 
              className={`flex h-14 w-8 cursor-pointer items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white ${
                canScrollLeft ? 'visible' : 'invisible'
              }`}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
          </div>

          <motion.div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex-1 flex flex-nowrap overflow-x-auto overflow-y-visible gap-3 scroll-smooth snap-x snap-mandatory py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {displayItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="snap-start shrink-0 w-36 group"
              >
                <div className="group relative h-52 rounded-xl overflow-hidden transition-transform duration-300 ease-out shadow-lg">
                  <img
                    src={item.imageUrl || item.poster_path}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex justify-end mb-auto">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/80 border border-indigo-400/80 text-white font-bold backdrop-blur-sm">
                        {item.type === 'movie' ? '🎬' : '🎮'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 drop-shadow-lg">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded text-white font-medium">
                          {item.type === 'movie' ? 'Movie' : 'Game'}
                        </span>
                        {item.rating && (
                          <span className="text-xs font-bold text-yellow-400 drop-shadow-lg">
                            ★ {item.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(79,70,229,0.4)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="w-10 shrink-0 flex items-center justify-center z-10">
            <button 
              className={`flex h-14 w-8 cursor-pointer items-center justify-center rounded-md bg-zinc-800/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-zinc-700 hover:text-white ${
                canScrollRight ? 'visible' : 'invisible'
              }`}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 auto-rows-max">
          {displayItems.map((item, idx) => (
            <motion.div
              key={item.id}
              className={`${positions[idx].gridCol} ${positions[idx].gridRow}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              whileHover={{ scale: positions[idx].scale * 1.05, y: -8 }}
            >
              <div className="group relative h-full rounded-xl md:rounded-2xl overflow-hidden shadow-lg">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 mb-1">{item.title}</h3>
                  <p className="text-xs md:text-sm text-zinc-300 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/30 border border-indigo-500/50 backdrop-blur-sm">
                      {item.type === 'movie' ? '🎬 Movie' : '🎮 Game'}
                    </span>
                    {item.rating && <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium">★ {item.rating.toFixed(1)}</span>}
                  </p>
                </div>
                <div className="absolute inset-0 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[inset_0_0_20px_rgba(79,70,229,0.2)]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorialPosterGrid;