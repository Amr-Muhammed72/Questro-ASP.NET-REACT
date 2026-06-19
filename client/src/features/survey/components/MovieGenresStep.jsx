import React from 'react';
import { motion } from 'framer-motion';
import GenreSelector from './GenreSelector';

const MovieGenresStep = ({ movieGenres, formData, updateFormData }) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <GenreSelector
        title="What movie genres do you like?"
        options={movieGenres.filter(g => !formData.dislikedMovieGenres.includes(g))}
        selected={formData.likedMovieGenres}
        onChange={(val) => updateFormData('likedMovieGenres', val)}
        maxLimit={3}
        minLimit={1}
      />
      <GenreSelector
        title="Any movie genres you dislike? (Optional)"
        options={movieGenres.filter(g => !formData.likedMovieGenres.includes(g))}
        selected={formData.dislikedMovieGenres}
        onChange={(val) => updateFormData('dislikedMovieGenres', val)}
        maxLimit={3}
        minLimit={0}
      />
    </motion.div>
  );
};

export default MovieGenresStep;
