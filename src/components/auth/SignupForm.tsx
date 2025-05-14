
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Mail, CheckCircle, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").refine(
    (password) => {
      // Check for at least one uppercase letter
      const hasUppercase = /[A-Z]/.test(password);
      // Check for at least one lowercase letter
      const hasLowercase = /[a-z]/.test(password);
      // Check for at least one number
      const hasNumber = /[0-9]/.test(password);
      // Check for at least one special character
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      return hasUppercase && hasLowercase && hasNumber && hasSpecial;
    },
    {
      message: "Password should contain at least one character of each: uppercase, lowercase, number, and special character"
    }
  ),
  confirmPassword: z.string(),
  role: z.enum(["student", "writer"]),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 3;

// Function to delay execution (for retry with exponential backoff)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SignupForm = () => {
  const { signUp, signInWithGoogle, isLoading: authLoading } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"student" | "writer">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
    },
  });

  // Update the form's role value when selectedRole changes
  useEffect(() => {
    form.setValue("role", selectedRole);
  }, [selectedRole, form]);

  const retrySignup = async (data: FormData, currentRetry: number): Promise<void> => {
    if (currentRetry >= MAX_RETRY_ATTEMPTS) {
      throw new Error("Signup failed after multiple attempts. The server might be experiencing issues. Please try again later.");
    }

    try {
      if (currentRetry > 0) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffTime = Math.pow(2, currentRetry - 1) * 1000;
        setErrorMessage(`Request timed out. Retrying (${currentRetry}/${MAX_RETRY_ATTEMPTS})...`);
        await delay(backoffTime);
      }
      
      await signUp(data.email, data.password, data.role);
      setRegistrationComplete(true);
    } catch (error: any) {
      console.error(`Retry attempt ${currentRetry} failed:`, error);
      
      // Only retry for timeout/network errors
      if (
        error.name === "AuthRetryableFetchError" ||
        error.message?.includes("timeout") ||
        error.message?.includes("network") ||
        error.status === 504
      ) {
        return retrySignup(data, currentRetry + 1);
      } else {
        // For other errors like "already registered", throw immediately
        throw error;
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setRetryAttempt(0);
      console.log("Form submitted with:", data);
      
      await retrySignup(data, 0);
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // User-friendly error messages
      if (error.message?.includes("timeout") || error.name === "AuthRetryableFetchError" || error.status === 504) {
        setErrorMessage("The server is taking too long to respond. Please try again later.");
      } else if (error.message?.includes("already registered")) {
        setErrorMessage("This email is already registered. Please log in instead.");
      } else if (error.message?.includes("network")) {
        setErrorMessage("Network connection issue. Please check your internet connection and try again.");
      } else if (error.message?.includes("rate limit")) {
        setErrorMessage("Too many signup attempts. Please wait a moment before trying again.");
      } else {
        setErrorMessage(error.message || "Failed to create account. Please try again.");
      }
      
      // Ensure registration complete is false to stay on the form
      setRegistrationComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      // Store the selected role in localStorage for Google sign-in
      localStorage.setItem('googleSignupRole', selectedRole);
      console.log("Starting Google Sign In with role:", selectedRole);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      // User-friendly error messages for Google sign-in
      if (error.message?.includes("popup")) {
        setErrorMessage("The sign in popup was closed. Please try again.");
      } else if (error.message?.includes("network") || error.message?.includes("timeout")) {
        setErrorMessage("Network issue. Please check your connection and try again.");
      } else {
        setErrorMessage(error.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const dismissError = () => {
    setErrorMessage(null);
  };

  if (registrationComplete) {
    return (
      <div className="space-y-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Registration successful!</AlertTitle>
          <AlertDescription className="text-green-700">
            Please check your email for a verification link. After verification, you'll be able to complete your profile.
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Link to="/login" className="text-brand-600 hover:text-brand-800 font-medium">
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="relative">
          <X 
            className="h-4 w-4 cursor-pointer absolute right-2 top-2" 
            onClick={dismissError}
          />
          <AlertTitle>Sign Up Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      {...field} 
                      type="email" 
                      placeholder="Enter your email"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={passwordVisible ? "text" : "password"}
                      placeholder="Create a password"
                      className="pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      tabIndex={-1}
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={confirmPasswordVisible ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                      tabIndex={-1}
                      aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                    >
                      {confirmPasswordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>I am a</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedRole(value as "student" | "writer");
                    }}
                    value={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="student" disabled={isLoading} />
                      <Label htmlFor="student" className="cursor-pointer">
                        Student
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="writer" id="writer" disabled={isLoading} />
                      <Label htmlFor="writer" className="cursor-pointer">
                        Writer
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {retryAttempt > 0 ? `Retrying (${retryAttempt}/${MAX_RETRY_ATTEMPTS})...` : "Creating Account..."}
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

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
          disabled={isLoading}
        >
          {isLoading ? (
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
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-brand-500 hover:text-brand-600"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default SignupForm;
