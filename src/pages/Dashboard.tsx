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

        if (displaySettings.use_actual_count) {
          const { count, error } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.error('Error fetching assignment count:', error);
            setAssignmentCount(null);
            return;
          }
          setAssignmentCount(count);
        } else {
          setAssignmentCount(displaySettings.display_count);
        }
      } catch (error) {
        console.error('An error occurred while fetching assignment count:', error);
      }
    };

    fetchAssignmentCount();

    // Subscribe to changes in both tables
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

  // Helper to get days since initial_date
  const getDaysSince = (dateString: string | null) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    // Floor to ensure full days have passed
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // Calculate incremented assignment count for dashboard card
  let dynamicAssignmentCount = assignmentCount;
  if (
    assignmentDisplayFields &&
    !assignmentDisplayFields.use_actual_count &&
    typeof assignmentDisplayFields.initial_assignments_value === 'number'
  ) {
    const days = getDaysSince(assignmentDisplayFields.initial_date);
    dynamicAssignmentCount = assignmentDisplayFields.initial_assignments_value + (days * 10);
  }

  // Display either user name if available, or fall back to email's prefix
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : "User");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-4 md:py-8 px-0 md:px-4">
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
                    
                    {/* Message notification for authorized writers */}
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
              
              {userRole === 'student' && (
                <Button onClick={() => navigate('/submit-assignment')} className={isMobile ? 'w-full' : ''}>
                  <Plus className="mr-2 h-4 w-4" /> New Assignment
                </Button>
              )}
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
            {userRole === 'student' ? <StudentDashboard /> : <WriterDashboard />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
