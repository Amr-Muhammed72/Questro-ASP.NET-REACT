import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useFilterSync = (useStore) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useStore((state) => state.filters);
  const setFilters = useStore((state) => state.setFilters);
  const clearFilters = useStore((state) => state.clearFilters);

  useEffect(() => {
    const urlFilters = {};
    for (const [key, value] of searchParams.entries()) {
      urlFilters[key] = value;
    }
    setFilters(urlFilters);
  }, [searchParams, setFilters]);

  const updateFilter = useCallback((key, value) => {
    setFilters({ [key]: value });
    
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    }, { replace: true });
  }, [setFilters, setSearchParams]);

  const resetFilters = useCallback(() => {
    clearFilters();
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [clearFilters, setSearchParams]);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
};
