export default function MovieDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[60vh] md:h-[70vh] bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10" />
        
        <div className="absolute bottom-0 left-0 w-full z-20 container mx-auto px-4 pb-10">
          <div className="flex flex-col md:flex-row items-end md:items-start gap-8">
            {/* Poster Skeleton */}
            <div className="w-48 md:w-64 aspect-[2/3] bg-zinc-800 rounded-xl shadow-2xl flex-shrink-0 relative -bottom-10 md:-bottom-20 z-30" />
            
            {/* Content Skeleton */}
            <div className="flex-1 w-full space-y-4 pb-4 md:pb-0">
              {/* Title */}
              <div className="h-12 md:h-16 bg-zinc-800 rounded w-3/4 max-w-md" />
              
              {/* Metadata */}
              <div className="flex gap-4">
                <div className="h-5 w-16 bg-zinc-800 rounded" />
                <div className="h-5 w-24 bg-zinc-800 rounded" />
                <div className="h-5 w-20 bg-zinc-800 rounded" />
              </div>
              
              {/* Genres */}
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-zinc-800 rounded-full" />
                <div className="h-8 w-24 bg-zinc-800 rounded-full" />
                <div className="h-8 w-16 bg-zinc-800 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pt-16 md:pt-28 pb-20 space-y-12">
        
        {/* Actions Skeleton */}
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          <div className="h-12 w-32 bg-zinc-800 rounded-full" />
          <div className="h-12 w-40 bg-zinc-800 rounded-full" />
          <div className="h-12 w-36 bg-zinc-800 rounded-full" />
          <div className="h-12 w-32 bg-zinc-800 rounded-full" />
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary Skeleton */}
            <div className="glassmorphism rounded-2xl p-6 md:p-8 space-y-6">
              <div className="h-6 w-1/3 bg-zinc-800 rounded" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-5/6 bg-zinc-800 rounded" />
                <div className="h-4 w-4/6 bg-zinc-800 rounded" />
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glassmorphism rounded-xl p-4 h-24 bg-zinc-800/50" />
              ))}
            </div>
          </div>

          {/* Sidebar / Extra Info */}
          <div className="space-y-6">
            <div className="glassmorphism rounded-2xl p-6 h-64 bg-zinc-800/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
