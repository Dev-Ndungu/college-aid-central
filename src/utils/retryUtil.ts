
/**
 * Utility function to retry an async function with exponential backoff
 * @param fn The async function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param retryableErrors Array of error names/types that are retryable
 * @param onRetry Callback function that runs before each retry
 * @returns Result of the async function or throws the last error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3,
  retryableErrors: string[] = ["AuthRetryableFetchError", "NetworkError", "TimeoutError"],
  onRetry?: (attempt: number, error: any, backoffTime: number) => void
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      
      // If we've reached max retries or this isn't a retryable error, throw
      const isRetryableError = retryableErrors.includes(error.name) || 
                               error.message?.toLowerCase().includes("timeout") ||
                               error.message?.toLowerCase().includes("network") ||
                               error.status === 504;
      
      if (attempt >= maxRetries || !isRetryableError) {
        throw error;
      }
      
      // Calculate backoff time: 2^attempt * 1000ms (1s, 2s, 4s, etc)
      const backoffTime = Math.pow(2, attempt - 1) * 1000;
      
      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error, backoffTime);
      }
      
      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
}
