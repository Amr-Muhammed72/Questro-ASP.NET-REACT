import React, { useState, useEffect, memo } from 'react';
import { getGenres } from '../../services/movieService';

const GenrePills = memo(({ activeGenreId, updateFilters }) => {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchGenres = async () => {
      try {
        const data = await getGenres();
        // Assuming API returns an array directly or an object with 'data' array
        const genreList = Array.isArray(data) ? data : (data.data || []);
        if (isMounted) {
          setGenres(genreList);
        }
      } catch (err) {
        console.error("Failed to load genres", err);
      }
    };
    fetchGenres();
    
    return () => { isMounted = false; }
  }, []);

  const displayGenres = genres.length > 0 ? genres : [];

  const handleTagClick = (genreId) => {
    // bypass text state and toggle genre pill state
    const newGenreId = activeGenreId === String(genreId) ? null : String(genreId);
    updateFilters({ genreId: newGenreId });
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6">
      {displayGenres.map(genre => {
        const isActive = activeGenreId === String(genre.genreId || genre.id);
        return (
          <button
            key={genre.genreId || genre.id}
            onClick={() => handleTagClick(genre.genreId || genre.id)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-full border transition-colors ${
              isActive
                ? 'bg-zinc-200 border-white text-black font-semibold shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                : 'bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
});

export default GenrePills;
