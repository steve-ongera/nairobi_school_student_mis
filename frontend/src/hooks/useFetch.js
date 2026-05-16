// hooks/useFetch.js
import { useState, useEffect, useCallback } from "react";

const useFetch = (apiFn, deps = [], initial = null) => {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn();
      
      // Handle different response structures
      let responseData = null;
      
      // If response has data property (axios response)
      if (response && response.data !== undefined) {
        // Check if data is paginated
        if (response.data.results !== undefined) {
          responseData = response.data.results;
        } else {
          responseData = response.data;
        }
      } 
      // If response itself is the data
      else if (response && response.results !== undefined) {
        responseData = response.results;
      }
      // If response is an array
      else if (Array.isArray(response)) {
        responseData = response;
      }
      // Otherwise use the response as is
      else {
        responseData = response;
      }
      
      setData(responseData);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      setError(msg);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiFn, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;