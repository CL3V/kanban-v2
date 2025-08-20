import { useState, useEffect, useCallback } from 'react';

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCSRFToken = useCallback(async () => {
    try {
      const response = await fetch('/api/csrf');
      if (response.ok) {
        const data = await response.json();
        setCSRFToken(data.token);
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  // Helper function to make secure API calls
  const secureApiCall = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
      throw new Error('CSRF token not available');
    }

    const headers = new Headers(options.headers);
    
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    return fetch(url, {
      ...options,
      headers
    });
  }, [csrfToken]);

  return {
    csrfToken,
    loading,
    refreshToken: fetchCSRFToken,
    secureApiCall
  };
}
