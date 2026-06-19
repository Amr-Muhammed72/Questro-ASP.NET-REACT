

export default function GameDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      
      
      {/* Hero Skeleton */}
      <div className="relative w-full min-h-[75vh] lg:h-[100dvh] lg:max-h-screen bg-[#09090b] flex items-center pt-24 pb-32 lg:py-0 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/50 animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-64 bg-gradient-to-t from-[#09090b] to-transparent z-10" />

        <div className="w-full max-w-screen-2xl relative z-20 mx-auto px-4 md:px-8 lg:px-12 xl:px-16 lg:h-full flex items-center lg:py-24">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 md:gap-14 lg:gap-20 w-full">
            
            {/* Poster Skeleton */}
            <div className="w-48 md:w-64 lg:w-72 xl:w-80 aspect-[2/3] flex-shrink-0 relative z-30 bg-zinc-800 rounded-2xl animate-pulse shadow-2xl border border-white/5" />

            {/* Text Content Skeleton */}
            <div className="flex-1 w-full flex flex-col pt-4 md:pt-10 lg:pt-0 lg:pl-8">
              {/* Title */}
              <div className="h-16 w-3/4 bg-zinc-800 rounded-xl mb-6 animate-pulse" />
              
              {/* Meta info */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-16 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-zinc-800 rounded-lg animate-pulse" />
              </div>

              {/* Genres */}
              <div className="flex gap-2 mb-10">
                <div className="h-8 w-20 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-zinc-800 rounded-lg animate-pulse" />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-auto">
                <div className="h-12 w-36 bg-zinc-800 rounded-xl animate-pulse" />
                <div className="h-12 w-32 bg-zinc-800 rounded-xl animate-pulse" />
                <div className="h-12 w-32 bg-zinc-800 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="relative z-20 w-full px-4 md:px-8 lg:px-12 xl:px-16 -mt-16 md:-mt-24 lg:-mt-32 pb-32">
        <div className="max-w-screen-2xl mx-auto space-y-16 md:space-y-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-11/12 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-48 w-full bg-zinc-800 rounded-2xl animate-pulse" />
              <div className="h-48 w-full bg-zinc-800 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

