import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { gameService } from '../../games/api/gameService';

export default function GameRatingStep({ formData, updateFormData }) {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Fetch highly recognizable games without any filters
        const data = await gameService.discoverGames({ sort: 'popularity.desc' }, 1, 60);
        let items = Array.isArray(data) ? data : (data.data || data.items || data.results || []);
        
        // Shuffle the array to provide a random mix of well-known games
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }
        setGames(items.slice(0, 24));
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGames();
  }, []);

  const handleRate = (game, stars) => {
    const gameId = game.rawgId || game.id;
    const existingIndex = formData.gameRatings.findIndex(r => r.id === gameId);
    let newRatings = [...formData.gameRatings];
    
    if (existingIndex >= 0) {
      newRatings[existingIndex].stars = stars;
    } else {
      newRatings.push({ id: gameId, stars });
    }
    
    updateFormData('gameRatings', newRatings);
  };

  const getRating = (gameId) => {
    const rating = formData.gameRatings.find(r => r.id === gameId);
    return rating ? rating.stars : 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">Rate Games You've Played</h3>
        <p className="text-zinc-400">
          This helps us build your initial recommendation profile for games.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-full bg-zinc-800/50 border border-zinc-700">
          <span className="text-sm font-medium text-white">
            Games rated: <span className={formData.gameRatings.length >= 1 ? "text-green-400" : "text-indigo-400"}>{formData.gameRatings.length}</span>/1
          </span>
          {formData.gameRatings.length >= 1 && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full ml-2">Minimum met</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {games.map((game, index) => {
          const gameId = game.rawgId || game.id;
          const uniqueKey = gameId || `game-${index}`;
          const currentRating = getRating(gameId);
          const isRated = currentRating > 0;
          const coverUrl = game.posterUrl || game.coverUrl || game.backgroundImage || 'https://via.placeholder.com/500x750?text=No+Cover';

          return (
            <motion.div
              key={uniqueKey}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                isRated ? 'ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'ring-1 ring-zinc-800'
              } ${!isRated && formData.gameRatings.length >= 1 ? 'opacity-70' : 'opacity-100'}`}
            >
              <div className="aspect-[2/3] relative group">
                <img 
                  src={coverUrl} 
                  alt={game.title || game.name} 
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-80" />
                
                <div className="absolute inset-0 flex flex-col justify-end p-3 transform transition-transform duration-300">
                  <h4 className="text-white font-medium text-sm line-clamp-2 mb-2">
                    {game.title || game.name}
                  </h4>
                  
                  {/* Star Rating UI */}
                  <div className="flex gap-1 justify-between bg-zinc-950/80 p-2 rounded-lg backdrop-blur-sm border border-zinc-800">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={(e) => {
                          e.preventDefault();
                          handleRate(game, star);
                        }}
                        className={`transition-colors duration-200 focus:outline-none ${
                          star <= currentRating ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400/50'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
