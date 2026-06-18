import React from 'react';

const GenreSelector = ({ title, options, selected, onChange, maxLimit, minLimit = 0 }) => {
  const toggleSelection = (optionName) => {
    if (selected.includes(optionName)) {
      onChange(selected.filter(o => o !== optionName));
    } else {
      if (selected.length < maxLimit) {
        onChange([...selected, optionName]);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-sm text-zinc-400">
          {selected.length} / {maxLimit} selected {minLimit > 0 && selected.length < minLimit ? `(Need at least ${minLimit})` : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const isDisabled = !isSelected && selected.length >= maxLimit;
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleSelection(option)}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                isSelected 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
                  : isDisabled
                    ? 'bg-zinc-800/50 text-zinc-600 border-zinc-700/50 cursor-not-allowed'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-700'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreSelector;
