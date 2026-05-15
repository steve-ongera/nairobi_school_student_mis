// hooks/useFetch.js
import { useState, useEffect, useCallback } from "react";

/**
 * Generic data-fetching hook.
 *
 * @param {Function} apiFn   – API function that returns a Promise (axios call)
 * @param {Array}    deps    – dependency array; re-fetches when these change
 * @param {*}        initial – initial data value
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch(
 *     () => studentsAPI.getStudents({ page: 1 }), [page]
 *   );
 */
const useFetch = (apiFn, deps = [], initial = null) => {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn();
      setData(response.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;