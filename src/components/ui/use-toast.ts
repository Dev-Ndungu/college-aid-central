
import { toast } from "sonner";

// Re-export the toast function
export { toast };

// Create a useToast hook that returns the toast function
export function useToast() {
  return {
    toast: toast,
    // For compatibility with shadcn/ui Toast component
    toasts: []
  };
}
