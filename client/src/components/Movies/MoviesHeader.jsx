import React, { memo } from 'react';

const MoviesHeader = memo(({ searchInput, handleSearchChange, onSearchSubmit }) => {
  return (
    <div className="flex flex-col space-y-4 text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight">
        Discover The Perfect Film <br className="hidden sm:block" /> With An Effortless Search And Selection
      </h1>
      
      <div className="relative max-w-3xl mx-auto w-full mt-6">
        <input
          type="text"
          placeholder="What are you looking for?"
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit && onSearchSubmit()}
          className="w-full bg-zinc-900/60 border border-zinc-700 rounded-full py-3 sm:py-4 pl-12 pr-6 text-sm sm:text-base md:text-lg text-white placeholder-zinc-500 focus:ring-1 focus:ring-white focus:border-zinc-500 focus:outline-none transition-all backdrop-blur-md"
        />
        <svg 
          className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchInput && (
          <button 
            onClick={() => handleSearchChange({ target: { value: '' }})}
            className="absolute right-4 sm:right-5 top-1/2 transform -translate-y-1/2 rounded-full p-1 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

export default MoviesHeader;