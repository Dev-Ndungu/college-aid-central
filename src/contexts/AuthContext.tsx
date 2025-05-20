import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  // Store the selected role for Google sign-in
  const [googleSignupRole, setGoogleSignupRole] = useState<'student' | 'writer'>('student');

  useEffect(() => {
    // Handle OAuth redirects in the URL - for cases when the user is redirected back to the app
    // with an access_token or error in the hash fragment
    const handleOAuthRedirectParams = async () => {
      // Check for OAuth-related parameters in the URL
      const hasHashParams = window.location.hash && 
        (window.location.hash.includes('access_token=') || 
         window.location.hash.includes('error='));
        
      const hasQueryParams = window.location.search &&
        (window.location.search.includes('code=') || 
         window.location.search.includes('error='));
      
      if ((hasHashParams || hasQueryParams) && location.pathname !== '/login') {
        console.log("Detected OAuth redirect parameters, handling auth state");
        
        try {
          // Get the current session - if the redirect was successful, we should have a session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // We have a valid session, redirect to dashboard
            console.log("OAuth redirect with valid session, redirecting to dashboard");
            
            // Check if we have a profile with a full_name (to determine if profile is complete)
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();
            
            // Decide where to redirect based on profile completion
            const hasCompletedProfile = profileData && profileData.full_name;
            if (hasCompletedProfile) {
              navigate('/dashboard', { replace: true });
            } else {
              navigate('/profile-completion', { replace: true });
            }
          }
        } catch (error) {
          console.error("Error handling OAuth redirect:", error);
        }
      }
    };
    
    // Run the OAuth redirect handler on initial load and URL changes
    handleOAuthRedirectParams();
  }, [location, navigate]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
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
              .select('role, avatar_url, full_name')
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
              
              // Handle different auth events
              if (event === 'SIGNED_IN') {
                // For existing users (with a complete profile), navigate to dashboard
                if (profile?.full_name) {
                  navigate('/dashboard', { replace: true });
                } else {
                  // For new users, navigate to profile completion
                  navigate('/profile-completion', { replace: true });
                }
              } else if (event === 'TOKEN_REFRESHED') {
                // When token is refreshed, make sure user stays on the right page
                // No navigation needed, just update the state
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
  }, [navigate]);

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
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();
          
        if (!profileError) {
          setUserRole(profile?.role as 'student' | 'writer' | null);
          
          // If profile is complete (has full_name), navigate to dashboard
          // Otherwise, navigate to profile completion
          if (profile?.full_name) {
            toast.success("You have successfully signed in.");
            navigate('/dashboard', { replace: true });
          } else {
            toast.success("Please complete your profile information.");
            navigate('/profile-completion', { replace: true });
          }
        }
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
      
      // Get the current URL origin to use for redirects
      const origin = window.location.origin;
      console.log("Current origin for redirect:", origin);
      
      // The final destination after authentication
      const finalRedirectUrl = `${origin}/dashboard`;
      console.log("Final redirect destination:", finalRedirectUrl);
      
      // Default role is student
      const role = "student";
      localStorage.setItem('googleSignupRole', role);
      console.log("Starting Google Sign In with default role:", role);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            role: role
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
