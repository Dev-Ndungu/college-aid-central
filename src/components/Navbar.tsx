
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/profile/UserAvatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, LayoutDashboard, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ReferralManager from '@/components/dashboard/ReferralManager';

const Navbar = () => {
  const {
    isAuthenticated,
    signOut,
    userRole,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // Check if we're on the login or signup page
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  
  // Check if we're in the middle of an OAuth flow by looking for tokens in the URL
  const isOAuthRedirect = location.hash && location.hash.includes('access_token=');
  
  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png" alt="Assignment Hub ✒️ Logo" className="h-12 w-12 rounded-lg p-0.5 shadow-sm" />
            <span className="font-bold text-[#0d2241] text-xl">Assignment Hub ✒️</span>
          </Link>
          
          {!isMobile ? (
            <nav>
              <ul className="flex items-center space-x-6">
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-primary transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="hover:text-primary transition-colors">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="p-1">
                  <Menu className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col gap-6 mt-6">
                  <Link to="/" className="text-lg font-medium hover:text-primary transition-colors">
                    Home
                  </Link>
                  <Link to="/how-it-works" className="text-lg font-medium hover:text-primary transition-colors">
                    How it Works
                  </Link>
                  <Link to="/resources" className="text-lg font-medium hover:text-primary transition-colors">
                    Resources
                  </Link>
                  <Link to="/contact" className="text-lg font-medium hover:text-primary transition-colors">
                    Contact
                  </Link>
                  {!isAuthenticated && !isLoading && (
                    <>
                      <Link to="/login" className="text-lg font-medium hover:text-primary transition-colors">
                        Sign In
                      </Link>
                      <Link to="/signup" className="text-lg font-medium hover:text-primary transition-colors">
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Dashboard button - always visible on desktop, hidden on mobile */}
                {!isMobile && (
                  <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                )}
                
                {/* Referral button for students */}
                {userRole === 'student' && !isMobile && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1" 
                    onClick={() => setIsReferralModalOpen(true)}
                  >
                    <Users className="h-4 w-4" />
                    <span>Refer Friends</span>
                  </Button>
                )}
                
                {/* User dropdown with avatar */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative p-0" aria-label="User menu">
                      <UserAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isMobile && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                          Dashboard
                        </DropdownMenuItem>
                        {userRole === 'student' && (
                          <DropdownMenuItem onClick={() => setIsReferralModalOpen(true)}>
                            <Users className="h-4 w-4 mr-2" />
                            Refer Friends
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              !isLoginPage && !isSignupPage && !isOAuthRedirect && !isMobile && !isLoading && (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* Referral Manager Modal */}
      <ReferralManager 
        open={isReferralModalOpen} 
        onClose={() => setIsReferralModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;
