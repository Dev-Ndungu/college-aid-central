import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Loader
} from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Get status color
const getStatusColor = (status: string) => {
  switch(status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'review':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get status label
const getStatusLabel = (status: string) => {
  switch(status) {
    case 'submitted':
      return 'Submitted';
    case 'in-progress':
      return 'In Progress';
    case 'review':
      return 'Under Review';
    case 'completed':
      return 'Completed';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Format date display
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Not set';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};

const StudentDashboard = () => {
  const { activeAssignments, completedAssignments, isLoading, error, fetchAssignments } = useAssignments();
  const { userId } = useAuth();
  const navigate = useNavigate();
  
  // Count upcoming deadlines (assignments due within 7 days)
  const upcomingDeadlines = activeAssignments.filter(assignment => {
    if (!assignment.due_date) return false;
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return dueDate <= sevenDaysFromNow && dueDate >= today;
  }).length;

  const createSampleAssignment = async () => {
    if (!userId) {
      toast.error("You need to be logged in to create assignments");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([{
          title: 'Sample Research Paper',
          subject: 'English Literature',
          description: 'This is a sample assignment created for testing the writer assignment system.',
          status: 'submitted', // Changed from 'in-progress' to 'submitted'
          user_id: userId,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
        }])
        .select();
    
    if (error) throw error;
    
    toast.success("Created a sample assignment for testing");
    // Refresh assignments list
    fetchAssignments();
    
  } catch (err: any) {
    console.error("Error creating sample assignment:", err);
    toast.error("Failed to create sample assignment: " + err.message);
  }
};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
        <h3 className="text-lg font-semibold">Error loading assignments</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              Active Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeAssignments.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedAssignments.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingDeadlines}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="mb-8">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {activeAssignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-gray-500">No active assignments found</p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/submit-assignment')}
                  >
                    Create a new assignment
                  </Button>
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    size="sm"
                    onClick={createSampleAssignment}
                  >
                    Create Sample Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>{assignment.subject}</CardDescription>
                      </div>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}
                      >
                        {getStatusLabel(assignment.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{assignment.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-brand-500 h-2.5 rounded-full" 
                          style={{ width: `${assignment.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    {assignment.due_date && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {formatDate(assignment.due_date)}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" size="sm" className="mr-2">
                      View Details
                    </Button>
                    <Button size="sm">
                      Track Progress
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {completedAssignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-gray-500">No completed assignments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {completedAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>{assignment.subject}</CardDescription>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        Grade: {assignment.grade || "Pending"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      Completed: {formatDate(assignment.completed_date)}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" size="sm">
                      View Assignment
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>
                View feedback for your completed assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-10 text-gray-500">
                No feedback available yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default StudentDashboard;
