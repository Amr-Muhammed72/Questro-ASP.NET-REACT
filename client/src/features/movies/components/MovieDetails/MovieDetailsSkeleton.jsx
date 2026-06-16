export default function MovieDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-[#09090b] animate-pulse flex flex-col">
      {/* 2. The Hero Section (Top Half) */}
      <div className="relative w-full min-h-[75vh] lg:h-[100dvh] lg:max-h-screen bg-[#0B0F19] flex items-center pt-24 pb-16 lg:py-0 overflow-hidden">
        <div className="w-full max-w-screen-2xl relative z-20 mx-auto px-4 md:px-8 lg:px-12 xl:px-16 lg:h-full flex items-center lg:py-24">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 md:gap-14 lg:gap-20 w-full lg:max-h-[calc(100vh-10rem)]">
            
            {/* Left Column: Movie Poster */}
            <div className="w-48 md:w-64 lg:w-72 xl:w-80 aspect-[2/3] flex-shrink-0 bg-zinc-800 rounded-2xl shadow-2xl border border-white/10" />

            {/* Right Column: Vertical Stack */}
            <div className="flex-1 w-full flex flex-col pt-4 md:pt-10 lg:pt-0 lg:pl-8 pb-10 lg:pb-0">
              {/* Title */}
              <div className="h-10 md:h-14 lg:h-16 bg-zinc-800 rounded w-3/4 max-w-2xl mb-6" />
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className="h-6 md:h-8 w-14 bg-zinc-800 rounded-md" />
                <div className="h-6 md:h-8 w-16 bg-zinc-800 rounded-md" />
                <div className="h-6 md:h-8 w-14 bg-zinc-800 rounded-md" />
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 mb-10">
                <div className="h-6 md:h-8 w-20 bg-zinc-800 rounded-md" />
                <div className="h-6 md:h-8 w-24 bg-zinc-800 rounded-md" />
                <div className="h-6 md:h-8 w-28 bg-zinc-800 rounded-md" />
              </div>



              {/* Synopsis Paragraph */}
              <div className="space-y-3 max-w-4xl mb-12">
                <div className="h-4 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-5/6 bg-zinc-800 rounded" />
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-12 w-40 bg-zinc-800 rounded-xl" />
                <div className="h-10 w-24 bg-zinc-800 rounded-xl" />
                <div className="h-10 w-28 bg-zinc-800 rounded-xl" />
                <div className="h-10 w-28 bg-zinc-800 rounded-xl" />
              </div>
            </div>

          </div>
        </div>
      </div>

      <main className="w-full px-4 md:px-8 lg:px-12 xl:px-16 pt-16 md:pt-24 pb-32 space-y-16 md:space-y-24">
        <div className="max-w-screen-2xl mx-auto space-y-16 md:space-y-24">
          
          {/* 3. The Overview Card (Middle) */}
          <div className="rounded-3xl p-6 md:p-10 bg-zinc-900/40 border border-white/5">
            <div className="flex flex-col md:flex-row gap-10 md:gap-16">
              
              {/* Left Side */}
              <div className="flex-1 md:w-3/5">
                <div className="h-8 w-32 bg-zinc-800 rounded mb-6" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-zinc-800 rounded" />
                  <div className="h-4 w-full bg-zinc-800 rounded" />
                  <div className="h-4 w-5/6 bg-zinc-800 rounded" />
                  <div className="h-4 w-4/6 bg-zinc-800 rounded" />
                </div>
              </div>

              {/* Right Side */}
              <div className="flex-1 md:w-2/5 mt-8 md:mt-0">
                <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-zinc-800" />
                      <div className="flex flex-col space-y-2 pt-1">
                        <div className="h-3 w-16 bg-zinc-800 rounded" />
                        <div className="h-5 w-24 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Genres stacked below grid */}
                <div className="mt-8">
                  <div className="h-3 w-16 bg-zinc-800 rounded mb-4" />
                  <div className="flex flex-wrap gap-3">
                    <div className="h-8 w-20 bg-zinc-800 rounded-xl" />
                    <div className="h-8 w-24 bg-zinc-800 rounded-xl" />
                    <div className="h-8 w-28 bg-zinc-800 rounded-xl" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Top Cast & Crew (Lower Middle) */}
          <div className="rounded-3xl p-6 md:p-10 bg-zinc-900/40 border border-white/5">
            <div className="h-8 w-48 bg-zinc-800 rounded mb-8" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-32 md:w-40 flex-shrink-0 flex flex-col gap-3">
                  <div className="w-full h-48 md:h-56 bg-zinc-800 rounded-xl" />
                  <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                  <div className="h-3 w-1/2 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* 5. Community Reviews (Bottom) */}
          <div className="max-w-[760px] flex flex-col items-start w-full">
            {/* Main heading */}
            <div className="h-8 md:h-10 w-64 bg-zinc-800 rounded mb-3" />
            
            {/* Sub-text */}
            <div className="h-4 w-48 bg-zinc-800 rounded mb-8" />
            
            {/* Reviews label */}
            <div className="h-5 w-20 bg-zinc-800 rounded mb-4" />
            
            {/* Empty state box */}
            <div className="w-full h-[140px] bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
              <div className="w-8 h-8 bg-zinc-800 rounded-full mb-3" />
              <div className="h-5 w-32 bg-zinc-800 rounded mb-2" />
              <div className="h-4 w-48 bg-zinc-800 rounded" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
