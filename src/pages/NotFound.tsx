
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from 'lucide-react';
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
      // Get the full URL including hash fragments
      const fullUrl = window.location.href;
      
      // Check if the URL contains auth-related parameters that might indicate a redirect
      const isAuthRedirect = fullUrl.includes('access_token=') || 
                            fullUrl.includes('code=') || 
                            fullUrl.includes('token=');

      console.log("URL check:", { 
        fullUrl, 
        isAuthRedirect, 
        hasAccessToken: fullUrl.includes('access_token='),
        pathname: location.pathname
      });
      
      if (isAuthRedirect) {
        console.log("Detected auth redirect parameters, attempting to process session");
        toast.info("Processing your sign-in...");
        
        try {
          // Set the session from the hash parameters if present
          if (fullUrl.includes('#access_token=')) {
            console.log("Found access token in URL hash, processing OAuth redirect");
            
            // The URL fragment with parameters starts after the # symbol
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken) {
              console.log("Setting session with access token from URL");
              
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (error) {
                console.error("Error setting session from redirect:", error);
                toast.error("Failed to complete sign-in. Please try again.");
                navigate('/login', { replace: true });
              } else if (data?.session) {
                console.log("Session successfully set from redirect");
                toast.success("Successfully signed in");
                
                // Get user profile to check if profile is complete
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', data.session.user.id)
                  .single();
                
                // Redirect based on profile completion
                if (profile && profile.full_name) {
                  navigate('/dashboard', { replace: true });
                } else {
                  navigate('/profile-completion', { replace: true });
                }
                return;
              }
            }
          } else {
            // If we don't have an access_token in the URL but detected auth parameters,
            // try to get the session directly
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              console.log("Found valid session after OAuth redirect");
              toast.success("Authentication successful");
              
              // Check if profile is complete
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', session.user.id)
                .single();
              
              // Redirect based on profile completion
              if (profile && profile.full_name) {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/profile-completion', { replace: true });
              }
              return;
            } else {
              console.log("No session found after OAuth redirect parameters detected");
              toast.error("Authentication failed. Please try signing in again.");
              navigate('/login', { replace: true });
            }
          }
        } catch (error) {
          console.error("Error processing auth redirect:", error);
          toast.error("Authentication error. Please try signing in again.");
          navigate('/login', { replace: true });
        }
        
        return;
      }

      // If not an auth redirect, it's a regular 404
      // Auto-redirect to homepage after 5 seconds
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 5000);

      return () => clearTimeout(timer);
    };
    
    processAuthRedirect();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-9xl font-bold text-brand-500">404</h1>
          <h2 className="text-3xl font-semibold mt-4 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            {window.location.href.includes('access_token=') 
              ? "We detected you've signed in. Processing your authentication..." 
              : "The page you are looking for doesn't exist or has been moved. You will be redirected to the homepage in a few seconds."}
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
