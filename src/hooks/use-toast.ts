
// Re-export from sonner
import { toast } from "sonner";

// Create a useToast hook that returns the toast function
export function useToast() {
  return {
    toast: {
      ...toast,
      // Add custom wrappers with improved default settings
      success: (message: string, options = {}) => 
        toast.success(message, { duration: 4000, ...options }),
      error: (message: string, options = {}) => 
        toast.error(message, { duration: 5000, ...options }),
      warning: (message: string, options = {}) => 
        toast.warning(message, { duration: 4500, ...options }),
      info: (message: string, options = {}) => 
        toast.info(message, { duration: 4000, ...options })
    }
  };
}

// Re-export the toast function for direct usage
export { toast };

