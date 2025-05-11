
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/profile/UserAvatar';

const Navbar = () => {
  const { isAuthenticated, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png" 
            alt="The Writers Hub Logo" 
            className="h-12 w-auto rounded-full p-0.5 shadow-sm"
          />
          <span className="text-2xl font-bold text-[#0d2241]">The Writers Hub</span>
        </Link>
        
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
        
        <div>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* Messages button */}
              <Link to="/messages">
                <Button variant="outline" size="sm">Messages</Button>
              </Link>
              
              {/* User dropdown with avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative p-0" aria-label="User menu">
                    <UserAvatar size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
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
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
