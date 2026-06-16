import { Star } from 'lucide-react';

export const CircularProgress = ({ score, label }) => {
  // score is out of 5
  const percentage = (score / 5) * 100;
  
  let strokeColor = '#22C55E'; // Green
  let textColor = 'text-green-500';
  
  if (score === 0) {
    strokeColor = '#52525B'; // Gray for N/A
    textColor = 'text-zinc-500';
  } else if (score < 2.0) {
    strokeColor = '#EF4444'; // Red
    textColor = 'text-red-500';
  } else if (score < 3.5) {
    strokeColor = '#EAB308'; // Yellow
    textColor = 'text-yellow-500';
  }
  
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
          <circle 
            cx="32" cy="32" r="28" 
            stroke={strokeColor} 
            strokeWidth="4" 
            fill="transparent" 
            strokeDasharray="175.93" 
            strokeDashoffset={175.93 - (175.93 * percentage) / 100}
            className="transition-all duration-1000 ease-out" 
            strokeLinecap="round" 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm lg:text-base flex items-center gap-1">
            {score > 0 ? (
              <>
                {(score * 2).toFixed(1)} <span className="text-xs text-zinc-400 font-normal">/10</span>
              </>
            ) : (
              <span className="text-xs text-zinc-400">N/A</span>
            )}
          </span>
        </div>
      </div>
      <span className="text-xs lg:text-sm text-zinc-400 font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};
