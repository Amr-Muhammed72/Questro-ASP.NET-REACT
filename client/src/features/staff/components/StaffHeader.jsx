import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, User, Briefcase } from 'lucide-react';

const StaffHeader = ({ actor, bgImageUrl, itemVariants, children }) => {
  return (
    <>
      {/* PROFILE IMAGE */}
      <motion.div variants={itemVariants} className="shrink-0 mx-auto lg:mx-0 w-[260px] sm:w-[320px] lg:w-[360px]">
        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10 ring-1 ring-white/10 group transition-transform duration-500 hover:-translate-y-2 hover:shadow-indigo-500/20">
          <img
            src={bgImageUrl}
            alt={actor.name}
            className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      </motion.div>

      {/* INFO & STATS */}
      <div className="flex-1 w-full pt-2 lg:pt-8">
        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-500">
            {actor.name}
          </span>
        </motion.h1>

        {/* BADGES */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 mt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium text-sm backdrop-blur-sm shadow-sm transition-colors hover:bg-indigo-500/20">
            <Briefcase size={16} />
            {actor.department || "Staff"}
          </div>
          {actor.gender && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-medium text-sm backdrop-blur-sm shadow-sm transition-colors hover:bg-white/10">
              <User size={16} />
              {actor.gender}
            </div>
          )}
          {actor.birthDate && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-medium text-sm backdrop-blur-sm shadow-sm transition-colors hover:bg-white/10">
              <CalendarDays size={16} />
              {actor.birthDate.split("T")[0]}
            </div>
          )}
          {actor.placeOfBirth && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-medium text-sm backdrop-blur-sm shadow-sm transition-colors hover:bg-white/10">
              <MapPin size={16} />
              {actor.placeOfBirth}
            </div>
          )}
        </motion.div>

        {/* BIOGRAPHY (Rendered as children) */}
        {children}
      </div>
    </>
  );
};

export default StaffHeader;
