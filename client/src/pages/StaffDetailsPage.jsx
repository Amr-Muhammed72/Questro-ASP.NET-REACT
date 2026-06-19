import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from "framer-motion";

import { useStaffDetails } from '../hooks/useStaffDetails';
import MovieRow from '../features/movies/components/MovieRow';
import StaffBackground from '../features/staff/components/StaffBackground';
import StaffHeader from '../features/staff/components/StaffHeader';
import StaffBiography from '../features/staff/components/StaffBiography';
import StaffSkeleton from '../features/staff/components/StaffSkeleton';

const StaffDetailsPage = () => {
  const { id } = useParams();
  const { actor, knownForMovies, isLoading, error } = useStaffDetails(id);
  const heroRef = useRef(null);

  if (isLoading || !actor) {
    return <StaffSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  const bgImageUrl = actor.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=random`;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden font-sans pb-10">
      
      {/* 🌌 DYNAMIC PARALLAX BACKGROUND */}
      <StaffBackground bgImageUrl={bgImageUrl} />


      {/* 🎭 HERO CONTENT */}
      <div ref={heroRef} className="relative z-10 px-6 md:px-16 pt-24 md:pt-32 max-w-7xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start"
        >
          <StaffHeader actor={actor} bgImageUrl={bgImageUrl} itemVariants={itemVariants}>
            <StaffBiography 
              biography={actor.biography} 
              itemVariants={itemVariants} 
              heroRef={heroRef} 
            />
          </StaffHeader>
        </motion.div>
      </div>

      {/* 🎬 KNOWN FOR MOVIES */}
      {knownForMovies.length > 0 && (
        <div className="relative z-10 mt-16 lg:mt-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
          >
            <MovieRow
              title="Known For"
              movies={knownForMovies}
            />
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default StaffDetailsPage;
