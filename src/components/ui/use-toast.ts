
// Re-export from sonner
export { toast } from "sonner";

// Create a useToast hook that returns the toast function
export function useToast() {
  return {
    toast
  };
}
