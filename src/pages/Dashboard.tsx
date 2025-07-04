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
  UserRound,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import WriterDashboard from '@/components/dashboard/WriterDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const { isAuthenticated, userEmail, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState<number | null>(null);
  const [assignmentDisplayFields, setAssignmentDisplayFields] = useState<{
    use_actual_count: boolean,
    display_count: number,
    initial_assignments_value: number,
    initial_students_value: number,
    initial_date: string
  } | null>(null);
  
  // Check if this is an authorized writer email
  const isAuthorizedWriter = userEmail === 'worldwritingfoundation@gmail.com' || userEmail === 'write.mefoundation@gmail.com';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch unread message count for authorized writers
  useEffect(() => {
    const fetchUnreadMessageCount = async () => {
      if (!isAuthorizedWriter || !isAuthenticated) return;
      
      try {
        const { count, error } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unread');
          
        if (error) {
          console.error('Error fetching unread messages:', error);
          return;
        }
        
        setUnreadMessageCount(count || 0);
        
        // Set up real-time listener for new messages
        const messagesSubscription = supabase
          .channel('contact-messages-changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'contact_messages' },
            () => {
              // Refetch count when any change happens
              fetchUnreadMessageCount();
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(messagesSubscription);
        };
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };
    
    fetchUnreadMessageCount();
  }, [isAuthenticated, isAuthorizedWriter, userEmail]);

  // Fetch assignment display info from the new table
  useEffect(() => {
    const fetchAssignmentCount = async () => {
      try {
        const { data: displaySettings, error: settingsError } = await supabase
          .from('assignment_display_count')
          .select('display_count, use_actual_count, initial_assignments_value, initial_students_value, initial_date')
          .single();

        if (settingsError) {
          console.error('Error fetching display settings:', settingsError);
          return;
        }
        setAssignmentDisplayFields(displaySettings);
        // DO NOT override assignmentCount – always use dynamic calculation below!
        setAssignmentCount(null);
      } catch (error) {
        console.error('An error occurred while fetching assignment count:', error);
      }
    };

    fetchAssignmentCount();

    const assignmentsSubscription = supabase
      .channel('assignments-count-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assignments' },
        () => {
          fetchAssignmentCount();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignment_display_count' },
        () => {
          fetchAssignmentCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsSubscription);
    };
  }, []);

  // Fetch user name from profile
  useEffect(() => {
    const fetchUserName = async () => {
      if (!isAuthenticated || !userEmail) return;

      try {
        // Use maybeSingle instead of single to prevent errors when no data is found
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('email', userEmail)
          .maybeSingle();

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

  // Helper to deterministically generate a pseudo-random number between min and max
  function pseudoRandom(seed: string, day: number, min: number = 5, max: number = 15) {
    // Simple xorshift
    let h = 2166136261 ^ (seed.charCodeAt(0) || 0);
    h ^= day;
    h = Math.imul(h ^ h >>> 17, 105903 ^ day);
    h = Math.imul(h ^ h >>> 11, 86813 ^ day);
    h ^= h >>> 15;
    // Map to range
    return min + (Math.abs(h) % (max - min + 1));
  }

  // Helper to get days since initial_date
  const getDaysSince = (dateString: string | null) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    // Floor to ensure full days have passed
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // Always use incremented count based on initial value + sum of daily pseudo random increments
  let dynamicAssignmentCount = null;
  if (
    assignmentDisplayFields &&
    typeof assignmentDisplayFields.initial_assignments_value === 'number'
  ) {
    const days = getDaysSince(assignmentDisplayFields.initial_date);
    let incrementSum = 0;
    for (let i = 0; i < days; i++) {
      incrementSum += pseudoRandom(assignmentDisplayFields.initial_date, i, 5, 15);
    }
    dynamicAssignmentCount = assignmentDisplayFields.initial_assignments_value + incrementSum;
  }

  // Display either user name if available, or fall back to email's prefix
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : "User");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-4 md:py-8 px-0 md:px-4">
        {/* Only the `StudentDashboard` gets container constraints. 
            The `WriterDashboard` will be absolutely full-width edge-to-edge (no container/wrappers). */}
        {userRole === 'student' ? (
          <div className="container mx-auto">
            <header className={`mb-4 md:mb-8 ${isMobile ? 'px-4' : ''}`}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  {!isMobile && (
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold">Dashboard</h1>
                      <span className="bg-brand-100 text-brand-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <UserRound className="h-3 w-3 mr-1" />
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </span>
                      {isAuthorizedWriter && unreadMessageCount > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center ml-2">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {unreadMessageCount} unread message{unreadMessageCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-gray-600">Welcome back, {displayName}</p>
                </div>
              </div>
            </header>
            {/* Trust-building assignment count */}
            {dynamicAssignmentCount !== null && (
              <div className={isMobile ? 'px-4' : ''}>
                <Card className="mb-4 md:mb-8 bg-green-50 border-green-200">
                  <CardContent className="p-4 flex items-center justify-center">
                    <p className="text-lg font-semibold text-green-800 text-center">
                      🏆 Over {dynamicAssignmentCount.toLocaleString()} assignments submitted by students like you!
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {/* Dashboard content */}
            <div className="dashboard-content">
              <StudentDashboard />
            </div>
          </div>
        ) : (
          // WRITER DASHBOARD: Edge-to-Edge, no `container`, no max-w, no mx-auto!
          <>
            <header className="mb-4 md:mb-8 px-4 md:px-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  {!isMobile && (
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold">Dashboard</h1>
                      <span className="bg-brand-100 text-brand-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <UserRound className="h-3 w-3 mr-1" />
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </span>
                      {isAuthorizedWriter && unreadMessageCount > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center ml-2">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {unreadMessageCount} unread message{unreadMessageCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-gray-600">Welcome back, {displayName}</p>
                </div>
              </div>
            </header>
            {/* Writer assignment count bar visible and full width */}
            {dynamicAssignmentCount !== null && (
              <div>
                <Card className="mb-4 md:mb-8 bg-green-50 border-green-200 rounded-none">
                  <CardContent className="p-4 flex items-center justify-center">
                    <p className="text-lg font-semibold text-green-800 text-center">
                      🏆 Over {dynamicAssignmentCount.toLocaleString()} assignments submitted by students like you!
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            {/* FULL WIDTH WRITER DASHBOARD */}
            <div className="w-full">
              <WriterDashboard />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
