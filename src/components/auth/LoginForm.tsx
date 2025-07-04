
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const { signIn, signInWithGoogle, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Clean up any Lemon Squeezy or payment-related parameters on component mount
  useEffect(() => {
    const currentUrl = window.location.href;
    if (currentUrl.includes('lemon') || currentUrl.includes('store') || currentUrl.includes('checkout') || currentUrl.includes('payment')) {
      console.log("Detected payment-related parameters, cleaning URL");
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Check URL for OAuth related parameters
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const hasAuthParams = hashParams.has('access_token') || 
                          queryParams.has('code') || 
                          queryParams.has('error');
                          
    if (hasAuthParams) {
      setIsProcessingOAuth(true);
      // The auth handling will be managed by AuthContext
    }
    
    // Check if there was an error with Google Auth
    const error = queryParams.get('error');
    const errorDescription = queryParams.get('error_description');
    
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      setErrorMessage(errorDescription || "Authentication failed. Please try again.");
      setIsProcessingOAuth(false);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      await signIn(email, password, rememberMe);
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Failed to sign in. Please check your credentials and try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage(null);
      setIsProcessingOAuth(true);
      toast.info("Redirecting to Google for authentication...");
      
      // Use the current origin as the base, but handle the fact we're using HashRouter
      // The hash (#) is important since we're using HashRouter
      const redirectUrl = `${window.location.origin}/#/dashboard`;
      console.log("Redirect URL for Google sign-in:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }
      
      // The redirect happens automatically after calling signInWithOAuth
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setIsProcessingOAuth(false);
      setErrorMessage(error.message || "Failed to sign in with Google. Please try again.");
    }
  };

  // Helper function to toggle password visibility
  function togglePasswordVisibility() {
    setShowPassword(!showPassword);
  }

  function dismissError() {
    setErrorMessage(null);
  }

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="relative">
          <X 
            className="h-4 w-4 cursor-pointer absolute right-2 top-2" 
            onClick={dismissError}
          />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {isProcessingOAuth && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-md">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-500" />
          <span>Processing login, please wait...</span>
        </div>
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
              disabled={isProcessingOAuth || isLoading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button 
              type="button"
              className="text-sm font-medium text-[#0d2241] hover:text-[#193764]"
              onClick={() => setShowForgotPassword(true)}
              disabled={isProcessingOAuth || isLoading}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
              disabled={isProcessingOAuth || isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isProcessingOAuth || isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="remember-me" 
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={isProcessingOAuth || isLoading}
          />
          <label
            htmlFor="remember-me"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remember me
          </label>
        </div>
        <Button 
          type="submit" 
          className="w-full bg-[#0d2241] hover:bg-[#193764]" 
          disabled={isProcessingOAuth || isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isProcessingOAuth || isLoading}
        >
          {isProcessingOAuth ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Google
        </Button>
      </div>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="font-medium text-[#0d2241] hover:text-[#193764]"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
