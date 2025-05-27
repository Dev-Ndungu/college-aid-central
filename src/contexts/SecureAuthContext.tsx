
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { sanitizeEmail, sanitizeText } from '@/utils/sanitize';
import { profileSchema, ProfileInput } from '@/schemas/profile';

type UserProfile = {
  full_name?: string | null;
  institution?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
};

type SecureAuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userRole: 'student' | 'writer' | null;
  userAvatar: string | null;
  userId: string | null; 
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, profile?: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: ProfileInput) => Promise<void>;
  updateUserAvatar: (avatarUrl: string) => Promise<void>;
};

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export function SecureAuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'writer' | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Secure session management with proper cleanup
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          
          console.log("Secure auth state changed:", event, session?.user?.id);
          
          if (session?.user) {
            setIsAuthenticated(true);
            setUserEmail(sanitizeEmail(session.user.email || ''));
            setUserId(session.user.id);
            
            // Defer profile fetch to prevent deadlocks
            setTimeout(async () => {
              if (!mounted) return;
              
              try {
                const { data: profile, error } = await supabase
                  .from('profiles')
                  .select('role, avatar_url, full_name')
                  .eq('id', session.user.id)
                  .single();
                  
                if (!error && profile && mounted) {
                  setUserRole(profile.role as 'student' | 'writer' | null);
                  setUserAvatar(profile.avatar_url ? sanitizeText(profile.avatar_url) : null);
                }
              } catch (error) {
                console.error("Error fetching secure profile:", error);
              }
            }, 100);
          } else {
            setIsAuthenticated(false);
            setUserEmail(null);
            setUserRole(null);
            setUserAvatar(null);
            setUserId(null);
          }
        });

        // THEN check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!error && session?.user && mounted) {
          setIsAuthenticated(true);
          setUserEmail(sanitizeEmail(session.user.email || ''));
          setUserId(session.user.id);
          
          // Get user profile safely
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role, avatar_url')
              .eq('id', session.user.id)
              .single();
              
            if (!profileError && profile && mounted) {
              setUserRole(profile.role as 'student' | 'writer' | null);
              setUserAvatar(profile.avatar_url ? sanitizeText(profile.avatar_url) : null);
            }
          } catch (error) {
            console.error("Error fetching initial profile:", error);
          }
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing secure auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      
      // Validate and sanitize email
      const cleanEmail = sanitizeEmail(email);
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        toast.success("You have successfully signed in.");
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Secure sign in error:', error);
      toast.error(error.message || "An error occurred during sign in.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      const origin = window.location.origin;
      const finalRedirectUrl = `${origin}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Secure Google sign in error:', error);
      toast.error(error.message || "An error occurred during Google sign in.");
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, profile?: UserProfile) => {
    try {
      setIsLoading(true);
      
      // Validate and sanitize email
      const cleanEmail = sanitizeEmail(email);
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Invalid email format');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const metadata = { 
        role: 'student',
        ...profile
      };
      
      const redirectUrl = `${window.location.origin}/profile-completion`;
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
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
        toast.success("Your account has been created. Please check your email for verification.");
      }
    } catch (error: any) {
      console.error('Secure sign up error:', error);
      toast.error(error.message || "An error occurred during sign up.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profile: ProfileInput) => {
    try {
      setIsLoading(true);
      
      // Validate input with Zod
      const validatedProfile = profileSchema.parse(profile);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      // Sanitize profile data
      const sanitizedProfile = {
        full_name: sanitizeText(validatedProfile.full_name),
        institution: validatedProfile.institution ? sanitizeText(validatedProfile.institution) : null,
        gender: validatedProfile.gender,
        phone_number: validatedProfile.phone_number ? sanitizeText(validatedProfile.phone_number) : null,
        institution_type: validatedProfile.institution_type ? sanitizeText(validatedProfile.institution_type) : null
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(sanitizedProfile)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Your profile has been updated.");
      
    } catch (error: any) {
      console.error('Error updating secure profile:', error);
      toast.error(error.message || "An error occurred during profile update.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    try {
      setIsLoading(true);
      
      // Validate URL format
      if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
        throw new Error('Invalid avatar URL format');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      setUserAvatar(avatarUrl);
      toast.success("Your avatar has been updated.");
      
    } catch (error: any) {
      console.error('Error updating secure avatar:', error);
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

      // Clear all state
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserRole(null);
      setUserAvatar(null);
      setUserId(null);
      
      // Clear any stored credentials
      localStorage.removeItem('rememberMe');
      
      toast.success("You have successfully signed out.");
      navigate('/');
    } catch (error: any) {
      console.error('Secure sign out error:', error);
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
    <SecureAuthContext.Provider value={value}>
      {children}
    </SecureAuthContext.Provider>
  );
}

export const useSecureAuth = (): SecureAuthContextType => {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
};
