
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle, X, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const resetPassword = async (attemptNumber: number): Promise<boolean> => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);
      
      // Calculate exponential backoff delay for retries
      if (attemptNumber > 0) {
        const backoffDelay = Math.min(2 ** attemptNumber * 1000, 10000); // Max 10 seconds
        await delay(backoffDelay);
      }
      
      // Make sure we use the absolute URL for the redirect
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      console.error(`Password reset attempt ${attemptNumber + 1} failed:`, error);
      
      // Check if it's a timeout error or network error that we should retry
      const isRetryableError = 
        error.message?.includes("timeout") || 
        error.message?.includes("network") || 
        error.name === "AuthRetryableFetchError" ||
        error.status === 504;
      
      // If we can retry and haven't exceeded max retries
      if (isRetryableError && attemptNumber < MAX_RETRIES - 1) {
        setErrorMessage(`Request timed out. Retrying (${attemptNumber + 1}/${MAX_RETRIES})...`);
        setRetryCount(attemptNumber + 1);
        return false; // Signal that we should retry
      } else {
        // This is either a non-retryable error or we've exceeded max retries
        if (isRetryableError) {
          setErrorMessage("Server is taking too long to respond. Please try again later.");
        } else {
          setErrorMessage(error.message || "Failed to send password reset email");
        }
        return true; // Signal that we should stop retrying
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsLoading(true);
    setRetryCount(0);
    
    let shouldStop = false;
    let attemptNumber = 0;
    
    while (!shouldStop && attemptNumber < MAX_RETRIES) {
      const result = await resetPassword(attemptNumber);
      
      if (result) {
        // If successful or non-retryable error
        shouldStop = true;
        
        // If no error message was set, it was successful
        if (!errorMessage) {
          setIsSubmitted(true);
          toast.success("Password reset link sent to your email");
        }
      }
      
      attemptNumber++;
    }
    
    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Check your email</h3>
          <p className="text-gray-600">
            We've sent a password reset link to <span className="font-medium">{email}</span>
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mt-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold">Forgot Password</h3>
        <p className="text-gray-600">
          Enter your email and we'll send you a link to reset your password
        </p>
      </div>
      
      {errorMessage && (
        <Alert variant="destructive" className="relative">
          <X 
            className="h-4 w-4 cursor-pointer absolute right-2 top-2" 
            onClick={() => setErrorMessage(null)}
          />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : "Sending..."}
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>
      
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Button>
    </div>
  );
};

export default ForgotPasswordForm;
