
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProfileTab from '@/components/dashboard/ProfileTab';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, UserRound } from 'lucide-react';

const Profile = () => {
  const { isAuthenticated, isLoading, userRole, userId } = useAuth();
  const navigate = useNavigate();
  const [showRoleChanger, setShowRoleChanger] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Add a function to toggle user role for testing purposes
  const toggleUserRole = async () => {
    if (!userId) return;
    
    try {
      // Get current role
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      const newRole = data.role === 'student' ? 'writer' : 'student';
      
      // Update role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      toast.success(`Role updated to ${newRole}`);
      // Wait a moment then reload page to update context
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      console.error("Error changing role:", err);
      toast.error("Failed to change role: " + err.message);
    }
  };

  // Function to check if writer_bio and writer_skills columns exist
  const checkWriterFields = async () => {
    if (!userId) return;
    
    try {
      // Type-safe RPC call
      const { error } = await supabase.rpc('add_writer_fields', {} as any);
      
      if (error) {
        console.error("Error checking writer fields:", error);
        toast.error("Failed to check writer fields: " + error.message);
      } else {
        toast.success("Writer profile fields are ready to use");
      }
    } catch (err: any) {
      console.error("Error:", err);
      toast.error("An error occurred: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-gray-600">View and update your profile information</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                  <UserRound className="h-3 w-3 mr-1" />
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
                </span>
                
                {/* Show toggle role button when clicking 5 times on role badge */}
                {showRoleChanger && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleUserRole}
                    className="text-xs h-6"
                  >
                    Switch to {userRole === 'student' ? 'Writer' : 'Student'} Role
                  </Button>
                )}
                
                {/* Add a hidden button to check/add writer fields */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={checkWriterFields}
                  className="text-xs h-6"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verify Profile Fields
                </Button>
              </div>
            </div>
          </header>

          <ProfileTab />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
