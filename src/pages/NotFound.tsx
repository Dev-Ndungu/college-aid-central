
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    navigate(-1);
  };

  // Attempt to handle auth redirects that may have failed
  useEffect(() => {
    const currentUrl = window.location.href;
    
    // Check if the URL contains auth-related parameters that might indicate a failed redirect
    const isAuthRedirect = currentUrl.includes('access_token=') || 
                          currentUrl.includes('code=') || 
                          currentUrl.includes('token=') ||
                          currentUrl.includes('profile-completion');

    if (isAuthRedirect) {
      console.log("Detected possible failed auth redirect, redirecting to profile-completion");
      toast.info("Redirecting you to complete your profile...");
      // Redirect to profile completion page which will handle the auth state
      navigate('/profile-completion', { replace: true });
      return;
    }

    // Auto-redirect to homepage after 5 seconds for regular 404s
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-9xl font-bold text-brand-500">404</h1>
          <h2 className="text-3xl font-semibold mt-4 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            The page you are looking for doesn't exist or has been moved.
            You will be redirected to the homepage in a few seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Home Page
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
