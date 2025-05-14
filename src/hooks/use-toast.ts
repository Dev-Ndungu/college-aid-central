
// Re-export from the proper location
export { toast } from "sonner";

// Create a useToast hook that returns the toast function
export function useToast() {
  return {
    toast
  };
}
