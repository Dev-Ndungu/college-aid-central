
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

type UserProfile = {
  full_name?: string | null;
  institution?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
};

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userRole: 'student' | 'writer' | null;
  userAvatar: string | null;
  userId: string | null; 
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, role: 'student' | 'writer', profile?: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  updateUserAvatar: (avatarUrl: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'writer' | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Store the selected role for Google sign-in
  const [googleSignupRole, setGoogleSignupRole] = useState<'student' | 'writer'>('student');

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        setUserId(session.user.id); // Set userId from session
        
        // Defer Supabase profile fetch with setTimeout to avoid deadlocks
        setTimeout(async () => {
          try {
            // Get user role and avatar from profiles table
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role, avatar_url')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              console.error("Error fetching user profile:", error);
            } else {
              setUserRole(profile?.role as 'student' | 'writer' | null);
              setUserAvatar(profile?.avatar_url);
              
              // If user signed in with Google and has no avatar yet, get it from Google
              if (!profile?.avatar_url && session.user.app_metadata?.provider === 'google') {
                const avatarUrl = session.user.user_metadata?.avatar_url;
                if (avatarUrl) {
                  // Update the profile with the Google avatar
                  await supabase
                    .from('profiles')
                    .update({ avatar_url: avatarUrl })
                    .eq('id', session.user.id);
                  
                  setUserAvatar(avatarUrl);
                }
              }
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        }, 0);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserRole(null);
        setUserAvatar(null);
        setUserId(null); // Clear userId on logout
      }
    });

    // THEN check for existing session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email);
          setUserId(session.user.id); // Set userId from session
          
          // Get user role and avatar from profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, avatar_url')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user profile:", error);
          } else {
            setUserRole(profile?.role as 'student' | 'writer' | null);
            setUserAvatar(profile?.avatar_url);
            
            // If user signed in with Google and has no avatar yet, get it from Google
            if (!profile?.avatar_url && session.user.app_metadata?.provider === 'google') {
              const avatarUrl = session.user.user_metadata?.avatar_url;
              if (avatarUrl) {
                // Update the profile with the Google avatar
                await supabase
                  .from('profiles')
                  .update({ avatar_url: avatarUrl })
                  .eq('id', session.user.id);
                
                setUserAvatar(avatarUrl);
              }
            }
          }
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
          setUserRole(null);
          setUserAvatar(null);
          setUserId(null); // Clear userId if no session
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

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Store the rememberMe preference in localStorage if the user chooses to be remembered
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        // Get user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (!profileError) {
          setUserRole(profile?.role as 'student' | 'writer' | null);
        }
        
        toast.success("You have successfully signed in.");
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || "An error occurred during sign in.");
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
      
      // Define the Supabase callback URL (this is what should be registered in Google Cloud Console)
      const supabaseCallbackUrl = "https://ihvgtaxvrqdnrgdddhdx.supabase.co/auth/v1/callback";
      console.log("Supabase callback URL:", supabaseCallbackUrl);
      
      // The final destination after authentication
      const finalRedirectUrl = "https://www.assignmenthub.org/profile-completion";
      console.log("Final redirect destination:", finalRedirectUrl);
      
      // Store the role in the queryParams object
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            role: selectedRole // Pass role as a query parameter
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
      toast.error(error.message || "An error occurred during Google sign in.");
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
      
      // Use window.location.origin for the correct production or development URL
      const redirectUrl = `${window.location.origin}/profile-completion`;
      console.log("Redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("User created successfully:", data.user.id);
        toast.success("Your account has been created. Please check your email for verification.");
        return;
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || "An error occurred during sign up.");
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
          gender: profile.gender,
          // Only update avatar_url if provided
          ...(profile.avatar_url && { avatar_url: profile.avatar_url })
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state if avatar was updated
      if (profile.avatar_url) {
        setUserAvatar(profile.avatar_url);
      }
      
      toast.success("Your profile has been updated.");
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "An error occurred during profile update.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setUserAvatar(avatarUrl);
      
      toast.success("Your avatar has been updated.");
      
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(error.message || "An error occurred during avatar update.");
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
      setUserAvatar(null);
      
      toast.success("You have successfully signed out.");
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || "An error occurred during sign out.");
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
    userAvatar,
    userId,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateUserProfile,
    updateUserAvatar
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
