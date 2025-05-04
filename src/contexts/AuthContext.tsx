
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

type UserProfile = {
  full_name?: string | null;
  institution?: string | null;
  gender?: string | null;
};

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userRole: 'student' | 'writer' | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, role: 'student' | 'writer', profile?: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'writer' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Store the selected role for Google sign-in
  const [googleSignupRole, setGoogleSignupRole] = useState<'student' | 'writer'>('student');

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        
        // Defer Supabase profile fetch with setTimeout to avoid deadlocks
        setTimeout(async () => {
          try {
            // Get user role from profiles table
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              console.error("Error fetching user profile:", error);
            } else {
              setUserRole(profile?.role as 'student' | 'writer' | null);
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        }, 0);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserRole(null);
      }
    });

    // THEN check for existing session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email);
          
          // Get user role from profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user profile:", error);
          } else {
            setUserRole(profile?.role as 'student' | 'writer' | null);
          }
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Get user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (!profileError) {
          setUserRole(profile?.role as 'student' | 'writer' | null);
        }
        
        toast({
          title: "Success",
          description: "You have successfully signed in.",
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "An error occurred during sign in.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Get the selected role from localStorage to ensure it persists through the redirect
      const selectedRole = localStorage.getItem('googleSignupRole') || 'student';
      console.log("Starting Google sign-in with role:", selectedRole);
      
      // Use the current full origin
      const redirectTo = `${window.location.origin}/profile-completion`;
      console.log("Redirect URL for Google auth:", redirectTo);
      
      // Store the role in the metadata
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Pass the selected role as user_metadata
          data: {
            role: selectedRole
          }
        }
      });

      if (error) {
        throw error;
      }
      
      // No need to navigate or show success message here
      // The OAuth flow will handle the redirect
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        variant: "destructive",
        title: "Google Sign In Failed",
        description: error.message || "An error occurred during Google sign in.",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    role: 'student' | 'writer', 
    profile?: UserProfile
  ) => {
    try {
      setIsLoading(true);
      
      console.log("Starting signup process with role:", role);
      
      // Store the role in localStorage for Google signup
      localStorage.setItem('googleSignupRole', role);
      
      // Create the metadata object with role and any provided profile data
      const metadata = { 
        role,
        ...profile
      };
      
      console.log("Signup metadata:", metadata);
      console.log("Redirect URL:", `${window.location.origin}/profile-completion`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/profile-completion`
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("User created successfully:", data.user.id);
        toast({
          title: "Success",
          description: "Your account has been created. Please check your email for verification.",
        });
        return;
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An error occurred during sign up.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profile: UserProfile) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          institution: profile.institution,
          gender: profile.gender
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An error occurred during profile update.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setIsAuthenticated(false);
      setUserEmail(null);
      setUserRole(null);
      
      toast({
        title: "Success",
        description: "You have successfully signed out.",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: error.message || "An error occurred during sign out.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isLoading,
    isAuthenticated,
    userEmail,
    userRole,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
