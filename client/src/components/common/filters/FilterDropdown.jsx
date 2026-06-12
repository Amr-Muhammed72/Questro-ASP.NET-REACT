import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const FilterDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = 'Select option', 
  searchable = false,
  searchPlaceholder = 'Search...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const display = selectedOption ? selectedOption.label : placeholder;

  const filteredOptions = searchable && query.trim() 
    ? options.filter(opt => opt.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
      >
        <span className="truncate">{display}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl"
          >
            {searchable && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-950">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`flex flex-col w-full text-left px-4 py-2 text-sm transition-colors ${
                      String(opt.value) === String(value)
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-500 text-center">No results found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
