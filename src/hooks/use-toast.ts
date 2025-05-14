
import { toast } from "sonner";

// Re-export the toast function
export { toast };

// Create a useToast hook that returns an object with a toast property
export function useToast() {
  return {
    toast: {
      // Adapt the interface to match what's used in the app
      (props: { title?: string; description?: string; variant?: "default" | "destructive" }) {
        const { title, description, variant } = props;
        
        if (variant === "destructive") {
          return toast.error(title, {
            description
          });
        }
        
        return toast.success(title, {
          description
        });
      },
      error: toast.error,
      success: toast.success,
      info: toast.info,
      warning: toast.warning
    }
  };
}
