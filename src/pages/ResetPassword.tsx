
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessingSession, setIsProcessingSession] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'valid' | 'invalid' | 'checking'>('checking');
  const navigate = useNavigate();
  const MAX_RETRIES = 3;

  // Check if we have a valid recovery session when component mounts
  useEffect(() => {
    const checkSession = async () => {
      try {
        setSessionStatus('checking');
        const { data, error } = await supabase.auth.getSession();
        
        console.log("Current session state:", data.session ? "Session exists" : "No session");
        
        if (!data.session) {
          // Get the URL hash if present (Supabase may include auth info in the hash)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");
          
          console.log("URL hash params:", { type, hasAccessToken: !!accessToken });
          
          // If we have tokens in the URL but no session, try to set the session
          if (accessToken && type === "recovery") {
            console.log("Setting session from recovery parameters");
            
            // Try to set the session multiple times if needed
            let sessionSet = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!sessionSet && attempts < maxAttempts) {
              try {
                const { error: setSessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || "",
                });
                
                if (setSessionError) {
                  console.error(`Error setting session (attempt ${attempts + 1}):`, setSessionError);
                  await delay(2000); // Wait before retrying
                } else {
                  console.log("Session set successfully from recovery parameters");
                  sessionSet = true;
                  setSessionStatus('valid');
                }
              } catch (err) {
                console.error(`Session setting attempt ${attempts + 1} failed:`, err);
                await delay(2000); // Wait before retrying
              }
              
              attempts++;
            }
            
            if (!sessionSet) {
              console.error("Failed to set session after multiple attempts");
              toast.error("Invalid or expired recovery link. Please request a new one.");
              setSessionStatus('invalid');
              setTimeout(() => navigate('/login'), 3000);
              return;
            }
            
            return;
          } else {
            console.error("No valid recovery session found");
            toast.error("Invalid or expired recovery link. Please request a new one.");
            setSessionStatus('invalid');
            // If no valid session, redirect back to login
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
        } else {
          setSessionStatus('valid');
        }
      } catch (error) {
        console.error("Error checking session:", error);
        toast.error("An error occurred. Please try again.");
        setSessionStatus('invalid');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsProcessingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const updatePassword = async (attemptNumber: number): Promise<boolean> => {
    try {
      // Clear previous error
      setErrorMessage(null);
      
      // Apply exponential backoff for retries
      if (attemptNumber > 0) {
        const backoffDelay = Math.min(2 ** attemptNumber * 1000, 10000); // Max 10 seconds
        await delay(backoffDelay);
      }
      
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      console.error(`Password update attempt ${attemptNumber + 1} failed:`, error);
      
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
          setErrorMessage(error.message || "Failed to reset password");
        }
        return true; // Signal that we should stop retrying
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setRetryCount(0);
    
    let shouldStop = false;
    let attemptNumber = 0;
    
    while (!shouldStop && attemptNumber < MAX_RETRIES) {
      const result = await updatePassword(attemptNumber);
      
      if (result) {
        // If successful or non-retryable error
        shouldStop = true;
        
        // If no error message was set, it was successful
        if (!errorMessage) {
          setIsComplete(true);
          toast.success("Password updated successfully");
          setTimeout(() => navigate('/login'), 3000);
        }
      }
      
      attemptNumber++;
    }
    
    setIsLoading(false);
  };

  // Render a loading state while we're checking the session
  if (isProcessingSession) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md space-y-8 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold">Verifying your recovery link...</h2>
            <p className="text-gray-600">Please wait while we process your request.</p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Render an error state if the session is invalid
  if (sessionStatus === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md space-y-8 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Invalid Recovery Link</h2>
            <p className="text-gray-600">This recovery link is invalid or has expired. Please request a new password reset link.</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Return to Login
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="mt-2 text-gray-600">
              {isComplete 
                ? "Your password has been reset successfully. Redirecting to login..." 
                : "Please enter your new password"}
            </p>
          </div>

          {errorMessage && !isComplete && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {!isComplete && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : "Updating..."}
                  </>
                ) : "Reset Password"}
              </Button>
            </form>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
