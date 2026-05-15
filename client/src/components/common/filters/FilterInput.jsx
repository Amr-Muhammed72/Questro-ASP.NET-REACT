import React from 'react';
import { Search } from 'lucide-react';

export const FilterInput = ({
  label,
  value,
  onChange,
  placeholder = 'Type here...',
  icon: Icon = Search,
  type = 'text',
  inputMode
}) => {
  return (
    <div className="w-full">
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">{label}</label>}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-zinc-500 pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          type={type}
          inputMode={inputMode}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors py-3 ${Icon ? 'pl-9 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
};