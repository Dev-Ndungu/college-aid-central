
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    navigate(-1);
  };

  // Improved handling for auth redirects
  useEffect(() => {
    const processAuthRedirect = async () => {
      // Check if we're on an OAuth redirect
      const isAccessTokenInHash = window.location.hash && window.location.hash.includes('access_token=');
      const isGoogleCallback = location.pathname.includes('/dashboard') && window.location.hash.includes('access_token=');
      
      console.log("URL check for auth:", { 
        hash: window.location.hash,
        pathname: location.pathname,
        isAccessTokenInHash,
        isGoogleCallback,
        fullUrl: window.location.href,
        isHashRouter: true // We're using HashRouter which affects path handling
      });
      
      // Handle OAuth redirects
      if (isAccessTokenInHash || isGoogleCallback) {
        console.log("Detected OAuth redirect with access token", window.location.hash);
        toast.info("Processing your authentication...");
        
        try {
          // Extract the access token from the URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            console.log("Found access token in URL, setting session");
            
            // Set the session using the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error("Error setting session from redirect:", error);
              toast.error("Failed to complete sign-in. Please try again.");
              navigate('/login', { replace: true });
            } else if (data?.session) {
              console.log("Session set successfully from redirect");
              toast.success("Successfully signed in");
              
              // Get user profile to check if profile is complete
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', data.session.user.id)
                .single();
              
              // Redirect based on profile completion
              if (profile && profile.full_name) {
                navigate('/#/dashboard', { replace: true });
              } else {
                navigate('/#/profile-completion', { replace: true });
              }
              return;
            }
          } else {
            // If there's a hash but no access token, try to get the session directly
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              console.log("Found valid session after OAuth redirect");
              navigate('/#/dashboard', { replace: true });
              return;
            }
          }
        } catch (error) {
          console.error("Error processing OAuth redirect:", error);
          toast.error("Authentication error. Please try signing in again.");
          navigate('/login', { replace: true });
        }
      } else {
        // Regular 404 page behavior - auto-redirect to homepage after 5 seconds
        const timer = setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    };
    
    processAuthRedirect();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-md mx-auto">
          {window.location.hash && window.location.hash.includes('access_token=') ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-brand-500" />
              <h2 className="text-2xl font-semibold">Processing Sign In</h2>
              <p className="text-gray-600">
                We're processing your authentication. You'll be redirected automatically in a moment...
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-9xl font-bold text-brand-500">404</h1>
              <h2 className="text-3xl font-semibold mt-4 mb-2">Page Not Found</h2>
              <p className="text-gray-600 mb-6">
                The page you are looking for doesn't exist or has been moved. You will be redirected to the homepage in a few seconds.
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
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
