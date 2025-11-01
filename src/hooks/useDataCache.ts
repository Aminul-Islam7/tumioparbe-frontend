import { useState, useEffect } from 'react';

// Global cache store
const cacheStore: Map<
    string,
    {
        data: any;
        timestamp: number;
        promise: Promise<any> | null;
    }
> = new Map();

// Default cache time: 5 minutes
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

/**
 * Custom hook for fetching and caching data
 *
 * @param cacheKey Unique key to identify this data in the cache
 * @param fetchFunction Function that returns a promise with the data
 * @param dependencies Array of dependencies that should trigger a refetch
 * @param cacheTime Time in ms to keep the cache valid (default: 5 minutes)
 * @returns Object containing the data, loading state, and error
 */
export function useDataCache<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    dependencies: any[] = [],
    cacheTime: number = DEFAULT_CACHE_TIME
) {
    const [data, setData] = useState<T | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [fetchCount, setFetchCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            // If already loading this key with a promise, use the existing promise
            const existingCache = cacheStore.get(cacheKey);

            if (existingCache?.promise) {
                try {
                    const result = await existingCache.promise;
                    if (isMounted) {
                        setData(result);
                        setIsLoading(false);
                    }
                    return;
                } catch (err) {
                    if (isMounted) {
                        setError(err instanceof Error ? err : new Error(String(err)));
                        setIsLoading(false);
                    }
                    return;
                }
            }

            // Check if we have valid cached data
            if (existingCache && Date.now() - existingCache.timestamp < cacheTime) {
                if (isMounted) {
                    setData(existingCache.data);
                    setIsLoading(false);
                }
                return;
            }

            setIsLoading(true);
            setError(null);

            // Create a promise for this fetch operation
            const fetchPromise = fetchFunction()
                .then((result) => {
                    if (controller.signal.aborted) return;

                    // Update the cache
                    cacheStore.set(cacheKey, {
                        data: result,
                        timestamp: Date.now(),
                        promise: null,
                    });

                    if (isMounted) {
                        setData(result);
                        setIsLoading(false);
                    }

                    return result;
                })
                .catch((err) => {
                    if (controller.signal.aborted) return;

                    if (isMounted) {
                        setError(err instanceof Error ? err : new Error(String(err)));
                        setIsLoading(false);
                    }

                    throw err;
                })
                .finally(() => {
                    // Clear the promise from cache when done
                    const current = cacheStore.get(cacheKey);
                    if (current) {
                        current.promise = null;
                    }
                });

            // Store the promise in cache to dedupe concurrent requests
            cacheStore.set(cacheKey, {
                data: existingCache?.data,
                timestamp: existingCache?.timestamp || 0,
                promise: fetchPromise,
            });

            // Increment fetch count for debugging
            setFetchCount((prev) => prev + 1);
        };

        fetchData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [...dependencies, cacheKey]);

    // Create a manual refetch function
    const refetch = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await fetchFunction();
            cacheStore.set(cacheKey, {
                data: result,
                timestamp: Date.now(),
                promise: null,
            });

            setData(result);
            setFetchCount((prev) => prev + 1);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Utility to clear specific cache entry
    const clearCache = () => {
        cacheStore.delete(cacheKey);
    };

    return { data, isLoading, error, refetch, clearCache, fetchCount };
}

// Utility function to manually clear the entire cache
export function clearAllCache() {
    cacheStore.clear();
}

// Utility function to manually clear a specific cache entry
export function clearCache(cacheKey: string) {
    cacheStore.delete(cacheKey);
}

export default useDataCache;
