
import { toast } from "sonner";

// Re-export the toast function for direct usage
export { toast };

// Create a useToast hook that returns the toast function
export function useToast() {
  return {
    toast
  };
}
