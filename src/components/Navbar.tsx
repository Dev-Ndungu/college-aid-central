
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-brand-500">
              CollegeAidCentral
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-brand-500 transition-colors">
              Home
            </Link>
            <Link to="/how-it-works" className="text-gray-700 hover:text-brand-500 transition-colors">
              How It Works
            </Link>
            <Link to="/resources" className="text-gray-700 hover:text-brand-500 transition-colors">
              Resources
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-brand-500 transition-colors">
              Contact
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-brand-500 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-gray-700 hover:text-brand-500 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                to="/resources" 
                className="text-gray-700 hover:text-brand-500 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Resources
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-brand-500 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <hr className="my-2 border-gray-200" />
              
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="outline" 
                    asChild 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    asChild 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button 
                    asChild 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
