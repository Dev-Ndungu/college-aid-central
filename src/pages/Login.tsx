
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for auth errors in URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      console.error('Auth error:', error, errorDescription);
      toast.error(errorDescription || 'Authentication error. Please try again.');
    }
    
    // Check for hash fragment that might indicate OAuth redirect issues
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.has('error') || hashParams.has('access_token')) {
      // If we detect OAuth parameters in the URL hash, redirect to profile completion
      // This helps recover from potential redirect issues
      navigate('/profile-completion', { replace: true });
    }
  }, [location, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Log In</h1>
            <p className="mt-2 text-gray-600">
              Access your account and manage your assignments
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
