import { useState, useEffect } from 'react';
import { fetchStaffDetails } from '../api/staffApi';

export const useStaffDetails = (id) => {
  const [actor, setActor] = useState(null);
  const [knownForMovies, setKnownForMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadStaff = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchStaffDetails(id);
        if (isMounted) {
          setActor(data);
          setKnownForMovies(data.knownForMovies || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      loadStaff();
      window.scrollTo(0, 0);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { actor, knownForMovies, isLoading, error };
};
