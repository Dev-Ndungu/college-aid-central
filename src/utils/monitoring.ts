
/**
 * Performance monitoring and error tracking utilities
 */

// Performance metrics tracking
export const trackPerformance = (name: string, startTime: number): void => {
  const duration = performance.now() - startTime;
  
  // Log slow operations (> 1 second)
  if (duration > 1000) {
    console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
  }
  
  // Store metrics for analysis
  if ('sendBeacon' in navigator) {
    const metrics = {
      name,
      duration,
      timestamp: Date.now(),
      url: window.location.pathname
    };
    
    // In production, send to analytics service
    console.log('Performance metric:', metrics);
  }
};

// Error boundary logging
export const logError = (error: Error, context?: Record<string, any>): void => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context: context || {}
  };
  
  console.error('Application error:', errorData);
  
  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { extra: errorData });
};

// Database query performance monitoring
export const monitorQuery = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    trackPerformance(`query:${queryName}`, startTime);
    return result;
  } catch (error) {
    logError(error as Error, { queryName, duration: performance.now() - startTime });
    throw error;
  }
};

// Memory usage monitoring
export const checkMemoryUsage = (): void => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize / 1024 / 1024;
    const total = memory.totalJSHeapSize / 1024 / 1024;
    
    if (used > 100) { // More than 100MB
      console.warn(`High memory usage: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
    }
  }
};

// Network connectivity monitoring
export const monitorNetworkStatus = (): (() => void) => {
  const handleOnline = () => {
    console.log('Network connection restored');
  };
  
  const handleOffline = () => {
    console.warn('Network connection lost');
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
