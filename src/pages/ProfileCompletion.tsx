
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, GraduationCap, Loader, Phone, User } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const studentFormSchema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  institutionType: z.enum(["university", "college"]),
  institution: z.string().min(2, "Please enter your institution name"),
  gender: z.enum(["male", "female", "other"]),
  phoneNumber: z.string().optional(),
});

const writerFormSchema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  gender: z.enum(["male", "female", "other"]),
  phoneNumber: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;
type WriterFormData = z.infer<typeof writerFormSchema>;

const ProfileCompletion = () => {
  const { isAuthenticated, isLoading: authLoading, userEmail, userRole, userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      fullName: "",
      institutionType: "university",
      institution: "",
      gender: "male",
      phoneNumber: "",
    },
  });

  const writerForm = useForm<WriterFormData>({
    resolver: zodResolver(writerFormSchema),
    defaultValues: {
      fullName: "",
      gender: "male",
      phoneNumber: "",
    },
  });

  // Handle authentication and profile checking
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        console.log("Checking auth state on profile completion page");
        
        // If we have URL parameters that might be from OAuth, try to exchange them
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const hasAuthParams = hashParams.has('access_token') || 
                              queryParams.has('code') || 
                              queryParams.has('token') ||
                              queryParams.has('error');
                              
        if (hasAuthParams) {
          console.log("Found auth parameters in URL, checking session");
          
          // Get the session
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error getting session:", error);
            toast.error("Authentication failed. Please try logging in again.");
            navigate('/login');
            return;
          }
          
          if (!data.session) {
            console.log("No session found after OAuth redirect");
            toast.error("Authentication failed. Please try logging in again.");
            navigate('/login');
            return;
          }

          console.log("Session found after OAuth redirect:", data.session.user.id);
          // Continue with profile check
        }
        
        // If user is not authenticated and we've checked auth, redirect to login
        if (!authLoading && !isAuthenticated) {
          console.log("User not authenticated, redirecting to login");
          navigate('/login');
          return;
        }
        
        // Check if user's profile is already complete
        if (userId) {
          console.log("Checking profile completion for user:", userId);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', userId)
            .single();
            
          if (error) {
            console.error("Error checking profile:", error);
            return;
          }
          
          // If profile already has a name, it's considered complete
          if (data && data.full_name) {
            console.log("Profile already complete, redirecting to dashboard");
            setProfileExists(true);
            // Redirect to dashboard if profile is already complete
            navigate('/dashboard');
            return;
          }
          
          // If we have a user but their profile isn't complete, pre-fill form with Google data if available
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.app_metadata?.provider === 'google') {
            console.log("Filling form with Google user data");
            const userData = user.user_metadata;
            
            // Determine the role - either from profile or from localStorage
            const role = data?.role || localStorage.getItem('googleSignupRole') || 'student';
            console.log("Determined user role:", role);
            
            if (role === 'student') {
              studentForm.setValue('fullName', userData.full_name || userData.name || "");
            } else {
              writerForm.setValue('fullName', userData.full_name || userData.name || "");
            }
          }
        }
      } catch (error) {
        console.error("Error checking auth and profile:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthAndProfile();
  }, [isAuthenticated, authLoading, navigate, userId, studentForm, writerForm]);

  const onSubmitStudent = async (data: StudentFormData) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setIsSubmitting(true);
      
      // Update the user's profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          institution: data.institution,
          institution_type: data.institutionType,
          gender: data.gender,
          phone_number: data.phoneNumber || null,
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast.success("Your profile has been successfully completed.");

      // Redirect to dashboard after successful completion
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "An error occurred while updating your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitWriter = async (data: WriterFormData) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setIsSubmitting(true);
      
      // Update the user's profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          gender: data.gender,
          phone_number: data.phoneNumber || null,
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast.success("Your profile has been successfully completed.");

      // Redirect to dashboard after successful completion
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "An error occurred while updating your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying your account...</span>
      </div>
    );
  }

  // If profile already exists, we shouldn't show this page at all
  if (profileExists) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-8 rounded-xl shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Complete Your Profile</h1>
            <p className="mt-2 text-gray-600">
              Please provide some additional information to complete your profile
            </p>
            {userEmail && (
              <p className="mt-2 text-sm text-gray-500">
                Signed in as: {userEmail}
              </p>
            )}
          </div>

          {userRole === 'student' ? (
            <Form {...studentForm}>
              <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className="space-y-6">
                <FormField
                  control={studentForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="Enter your full name"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={studentForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="Your phone number"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={studentForm.control}
                  name="institutionType"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Institution Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="university" id="university" />
                            <FormLabel htmlFor="university" className="cursor-pointer">
                              University
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="college" id="college" />
                            <FormLabel htmlFor="college" className="cursor-pointer">
                              College
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={studentForm.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="College/University name"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={studentForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Updating Profile..." : "Complete Profile"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...writerForm}>
              <form onSubmit={writerForm.handleSubmit(onSubmitWriter)} className="space-y-6">
                <FormField
                  control={writerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="Enter your full name"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={writerForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="Your phone number"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={writerForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Updating Profile..." : "Complete Profile"}
                </Button>
              </form>
            </Form>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileCompletion;
