import React from 'react';

export const FilterPills = ({ 
  label, 
  options, 
  selectedValue, 
  onChange 
}) => {
  return (
    <div className="w-full">
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 block">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = String(opt.value) === String(selectedValue);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(isSelected ? '' : opt.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                isSelected
                  ? 'border-zinc-300 bg-zinc-200 text-zinc-900 shadow-sm'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
