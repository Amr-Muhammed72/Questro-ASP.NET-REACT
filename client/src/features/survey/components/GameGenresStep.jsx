import React from 'react';
import { motion } from 'framer-motion';
import GenreSelector from './GenreSelector';

const GameGenresStep = ({ gameGenres, formData, updateFormData }) => {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <GenreSelector
        title="What game genres do you like?"
        options={gameGenres.filter(g => !formData.dislikedGameGenres.includes(g))}
        selected={formData.likedGameGenres}
        onChange={(val) => updateFormData('likedGameGenres', val)}
        maxLimit={3}
        minLimit={1}
      />
      <GenreSelector
        title="Any game genres you dislike? (Optional)"
        options={gameGenres.filter(g => !formData.likedGameGenres.includes(g))}
        selected={formData.dislikedGameGenres}
        onChange={(val) => updateFormData('dislikedGameGenres', val)}
        maxLimit={3}
        minLimit={0}
      />
    </motion.div>
  );
};

export default GameGenresStep;
