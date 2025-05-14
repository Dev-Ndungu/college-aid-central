
// Re-export from the proper location
import { toast } from "sonner";

// Create a useToast hook that returns the toast function
export function useToast() {
  return {
    toast: toast
  };
}

// Re-export the toast function for direct usage
export { toast };

