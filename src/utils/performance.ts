
/**
 * Performance optimization utilities
 */

// Debounce function for search/filter inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll/resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Lazy loading for images
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Memory-efficient pagination
export const PAGINATION_CONFIGS = {
  assignments: {
    pageSize: 20,
    preloadNext: true
  },
  messages: {
    pageSize: 50,
    preloadNext: false
  }
} as const;

// Cache key generators for React Query
export const cacheKeys = {
  assignments: (userId: string, role: string) => ['assignments', userId, role],
  assignment: (id: string) => ['assignment', id],
  profile: (userId: string) => ['profile', userId],
  writers: () => ['writers'],
  messages: (userId: string) => ['messages', userId]
} as const;
