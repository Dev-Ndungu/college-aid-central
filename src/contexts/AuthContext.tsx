
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userRole: 'student' | 'writer' | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'student' | 'writer') => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'writer' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email);
          
          // Get user role from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          setUserRole(profile?.role as 'student' | 'writer' | null);
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        
        // Get user role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        setUserRole(profile?.role as 'student' | 'writer' | null);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserRole(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        setUserRole(profile?.role as 'student' | 'writer' | null);
        
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
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'student' | 'writer') => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Your account has been created. Please check your email for verification.",
        });
        
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An error occurred during sign up.",
      });
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
    signUp,
    signOut
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
