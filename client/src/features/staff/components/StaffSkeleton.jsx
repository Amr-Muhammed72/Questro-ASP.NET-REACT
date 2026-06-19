import React from 'react';
import { ChevronLeft } from 'lucide-react';

const StaffSkeleton = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden font-sans pb-10">
      {/* 🎭 HERO CONTENT SKELETON */}
      <div className="relative z-10 px-6 md:px-16 pt-24 md:pt-32 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start animate-pulse">
          
          {/* PROFILE IMAGE SKELETON */}
          <div className="shrink-0 mx-auto lg:mx-0 w-[260px] sm:w-[320px] lg:w-[360px]">
            <div className="w-full aspect-[2/3] rounded-[2rem] bg-white/5 border border-white/10 shadow-2xl shadow-black/50" />
          </div>

          {/* INFO & STATS SKELETON */}
          <div className="flex-1 w-full pt-2 lg:pt-8">
            {/* Name Skeleton */}
            <div className="h-12 sm:h-16 md:h-20 bg-white/10 rounded-2xl w-[70%] mb-4" />
            
            {/* Badges Skeleton */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="h-[42px] w-24 bg-indigo-500/10 border border-indigo-500/20 rounded-full" />
              <div className="h-[42px] w-20 bg-white/5 border border-white/10 rounded-full" />
              <div className="h-[42px] w-32 bg-white/5 border border-white/10 rounded-full" />
              <div className="h-[42px] w-28 bg-white/5 border border-white/10 rounded-full" />
            </div>

            {/* BIOGRAPHY SKELETON */}
            <div className="mt-12 bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
              {/* Bio Title Skeleton */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/50"></div>
                </div>
                <div className="h-6 w-32 bg-white/10 rounded-md" />
              </div>

              {/* Bio Text Skeleton */}
              <div className="space-y-4">
                <div className="h-4 bg-white/5 rounded-md w-full" />
                <div className="h-4 bg-white/5 rounded-md w-full" />
                <div className="h-4 bg-white/5 rounded-md w-[90%]" />
                <div className="h-4 bg-white/5 rounded-md w-[95%]" />
                <div className="h-4 bg-white/5 rounded-md w-[85%]" />
                <div className="h-4 bg-white/5 rounded-md w-full" />
                <div className="h-4 bg-white/5 rounded-md w-[60%]" />
              </div>

              {/* Button Skeleton */}
              <div className="mt-8 h-10 w-32 bg-indigo-500/10 rounded-full" />
            </div>
          </div>

        </div>
      </div>
      
      {/* 🎬 KNOWN FOR SKELETON */}
      <div className="relative z-10 mt-16 lg:mt-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
         <div className="animate-pulse">
           <div className="h-8 w-48 bg-white/10 rounded-md mb-8" />
           <div className="flex gap-4 overflow-hidden">
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="min-w-[160px] sm:min-w-[200px] aspect-[2/3] bg-white/5 rounded-2xl border border-white/10" />
             ))}
           </div>
         </div>
      </div>
    </div>
  );
};

export default StaffSkeleton;
