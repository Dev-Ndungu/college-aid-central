
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  UserRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import WriterDashboard from '@/components/dashboard/WriterDashboard';
import ProfileTab from '@/components/dashboard/ProfileTab';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { isAuthenticated, userEmail, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch user name from profile
  useEffect(() => {
    const fetchUserName = async () => {
      if (!isAuthenticated || !userEmail) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('email', userEmail)
          .single();

        if (error) {
          console.error("Error fetching user name:", error);
          return;
        }

        if (data && 'full_name' in data) {
          setUserName(data.full_name);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };

    fetchUserName();

    // Set up real-time listener for profile updates
    const profileSubscription = supabase
      .channel('profile-name-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `email=eq.${userEmail}` },
        (payload) => {
          const newData = payload.new as any;
          if (newData && typeof newData === 'object' && 'full_name' in newData) {
            setUserName(newData.full_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [isAuthenticated, userEmail]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !userRole) {
    return null; // Will redirect to login in useEffect
  }

  // Display either user name if available, or fall back to email's prefix
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : "User");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                  <span className="bg-brand-100 text-brand-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                    <UserRound className="h-3 w-3 mr-1" />
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600">Welcome back, {displayName}</p>
              </div>
              
              {userRole === 'student' && (
                <Button onClick={() => navigate('/submit-assignment')}>
                  <Plus className="mr-2 h-4 w-4" /> New Assignment
                </Button>
              )}
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              {userRole === 'student' ? <StudentDashboard /> : <WriterDashboard />}
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
