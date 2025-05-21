import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatComponent from '@/components/chat/ChatComponent';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { ChevronLeft, Clock, CheckCircle, Info, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OnlineStatus from './OnlineStatus';
import { usePresence } from '@/hooks/usePresence';

interface Writer {
  id: string;
  full_name: string | null;
  email: string;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

interface AssignmentWithWriter {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  status: string;
  user_id: string;
  writer_id: string | null;
  writer?: Writer | null;
  user?: User | null;
  progress?: number | null;
  student_email?: string | null; // Add the student_email property
  student_name?: string | null; // Also add student_name for consistency
  student_phone?: string | null; // Add student_phone for completeness
}

interface AssignmentChatComponentProps {
  assignmentId?: string;
}

const AssignmentChatComponent: React.FC<AssignmentChatComponentProps> = ({ assignmentId }) => {
  const [assignment, setAssignment] = useState<AssignmentWithWriter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { userId, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Initialize presence tracking
  usePresence();

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching assignment with ID:', assignmentId);
        
        // Fetch assignment with writer and user details
        const { data, error } = await supabase
          .from('assignments')
          .select('*, writer:profiles(id, full_name, email), user:profiles(id, full_name, email)')
          .eq('id', assignmentId)
          .single();

        if (error) {
          console.error('Error fetching assignment:', error);
          throw error;
        }

        console.log('Raw assignment data:', data);

        // Transform the data to match our expected type
        const transformedData: AssignmentWithWriter = {
          ...data,
          writer: data.writer || null, 
          user: data.user || null
        };

        console.log('Transformed assignment data:', transformedData);
        setAssignment(transformedData);
      } catch (err: any) {
        console.error('Error fetching assignment:', err);
        setError(err.message || 'Failed to fetch assignment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();

    // Set up real-time subscription for assignment updates
    const assignmentSubscription = supabase
      .channel(`assignment-${assignmentId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignments', filter: `id=eq.${assignmentId}` }, 
        () => {
          fetchAssignment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentSubscription);
    };
  }, [assignmentId]);

  // Determine who the current user should chat with
  const chatRecipientId = userRole === 'student' 
    ? assignment?.writer_id 
    : assignment?.user_id;

  // Handle assignment status update
  const handleStatusUpdate = async (status: string) => {
    if (!assignment || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Update status and completed_date if status is 'completed'
      const updates: {
        status: string;
        completed_date?: string | null;
        updated_at: string;
      } = {
        status,
        updated_at: new Date().toISOString()
      };
      
      // Set completed date if status is completed
      if (status === 'completed') {
        updates.completed_date = new Date().toISOString();
      } else {
        updates.completed_date = null;
      }
      
      const { error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignment.id);
        
      if (error) throw error;
      
      // Notify student about status change
      if (assignment.user_id) {
        const statusMessages = {
          'in_progress': `I'm currently working on your assignment "${assignment.title}".`,
          'almost_done': `I'm almost done with your assignment "${assignment.title}". It should be completed soon.`,
          'completed': `Great news! I've completed your assignment "${assignment.title}". Please review it and let me know if you have any questions.`
        };
        
        const message = statusMessages[status as keyof typeof statusMessages];
        
        if (message) {
          await supabase
            .from('messages')
            .insert({
              sender_id: userId,
              recipient_id: assignment.user_id,
              content: message,
              assignment_id: assignment.id,
              read: false
            });
        }
        
        // Send email notification to student about the status change
        try {
          console.log('Sending email notification about status change');
          
          // Get writer details
          const { data: writerData, error: writerError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', userId)
            .single();
            
          if (writerError) {
            console.error('Error fetching writer data:', writerError);
          }
          
          // Use the full URL with the correct project reference for the function call
          const projectRef = "ihvgtaxvrqdnrgdddhdx";
          const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/notify-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // No authorization header needed since we've made the function public
            },
            body: JSON.stringify({
              type: 'assignment_status_update',
              assignment: assignment,
              status: status,
              writer: writerData
            }),
          });
          
          if (!response.ok) {
            const responseText = await response.text();
            console.error('Error sending status update notification:', response.status, responseText);
          } else {
            const responseJson = await response.json();
            console.log('Status update notification sent successfully:', responseJson);
          }
          
        } catch (notifyError) {
          console.error('Error sending status update notification:', notifyError);
        }
      }
      // Handle anonymous submissions that have student_email but no user_id
      else if (assignment.student_email) {
        try {
          console.log('Sending email notification about status change to anonymous student');
          
          // Get writer details
          const { data: writerData, error: writerError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', userId)
            .single();
            
          if (writerError) {
            console.error('Error fetching writer data:', writerError);
          }
          
          // Use the full URL with the correct project reference for the function call
          const projectRef = "ihvgtaxvrqdnrgdddhdx";
          const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/notify-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // No authorization header needed since we've made the function public
            },
            body: JSON.stringify({
              type: 'assignment_status_update',
              assignment: assignment,
              status: status,
              writer: writerData
            }),
          });
          
          if (!response.ok) {
            const responseText = await response.text();
            console.error('Error sending status update notification:', response.status, responseText);
          } else {
            const responseJson = await response.json();
            console.log('Status update notification sent successfully:', responseJson);
          }
          
        } catch (notifyError) {
          console.error('Error sending status update notification to anonymous student:', notifyError);
        }
      }
      
      toast.success(`Assignment status updated to ${status.replace('_', ' ')}`);
      
    } catch (err: any) {
      console.error('Error updating assignment status:', err);
      toast.error(err.message || 'Failed to update assignment status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6 text-center">
        <Info className="mx-auto h-10 w-10 text-destructive mb-2" />
        <h3 className="text-lg font-medium">Unable to load assignment</h3>
        <p className="text-muted-foreground mb-4">{error || 'Assignment not found'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // Check if the current user is authorized to view this assignment
  const isAuthorized = userId && (
    (userRole === 'student' && assignment.user_id === userId) || 
    (userRole === 'writer' && (assignment.writer_id === userId || !assignment.writer_id))
  );

  if (!isAuthorized) {
    return (
      <div className="p-6 text-center">
        <Info className="mx-auto h-10 w-10 text-destructive mb-2" />
        <h3 className="text-lg font-medium">Unauthorized</h3>
        <p className="text-muted-foreground mb-4">You are not authorized to view this assignment</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // For students - handle case where no writer has taken the assignment
  if (userRole === 'student' && !assignment.writer_id) {
    return (
      <div className="p-6 text-center">
        <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Waiting for a writer</h3>
        <p className="text-muted-foreground mb-4">
          This assignment has not been taken by a writer yet. 
          Chat will be available once a writer takes this assignment.
        </p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // For writers - handle case where they haven't taken the assignment yet
  if (userRole === 'writer' && !assignment.writer_id) {
    const handleTakeAssignment = async () => {
      try {
        // Get writer details first to include in the notification
        const { data: writerData, error: writerError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', userId)
          .single();
          
        if (writerError) {
          console.error('Error fetching writer data:', writerError);
          throw new Error('Failed to get writer details');
        }
      
        // Update the assignment with the writer's ID
        const { data, error } = await supabase
          .from('assignments')
          .update({
            writer_id: userId,
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.id)
          .select();

        if (error) throw error;
        
        toast.success("Assignment taken successfully");
        
        // Send notification to student about assignment being taken
        const message = `I've taken your assignment "${assignment.title}" and will begin working on it. Let me know if you have any questions!`;
        
        if (assignment.user_id) {
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              sender_id: userId,
              recipient_id: assignment.user_id,
              content: message,
              assignment_id: assignment.id,
              read: false
            });
            
          if (messageError) {
            console.error('Error sending initial message:', messageError);
          }
        }
        
        // Send email notification to student
        try {
          console.log('Sending assignment taken email notification');
          
          // Use the full URL with the correct project reference for the function call
          const projectRef = "ihvgtaxvrqdnrgdddhdx";
          const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/notify-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'assignment_taken',
              assignment: assignment,
              writer: writerData
            }),
          });
          
          if (!response.ok) {
            const responseText = await response.text();
            console.error('Error sending assignment taken notification:', response.status, responseText);
          } else {
            const responseJson = await response.json();
            console.log('Assignment taken notification sent successfully:', responseJson);
          }
          
        } catch (notifyError) {
          console.error('Error sending assignment taken notification:', notifyError);
        }
        
      } catch (err: any) {
        console.error('Error taking assignment:', err);
        toast.error(err.message || "Failed to take assignment");
      }
    };
    
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="mb-6 bg-background/50 backdrop-blur-sm border-purple-800/30">
          <CardHeader className="bg-purple-900/20">
            <CardTitle>{assignment.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Subject: {assignment.subject}</p>
          </CardHeader>
          <CardContent className="pt-6">
            {assignment.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-1">Description:</h3>
                <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}
            
            <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-md p-4 backdrop-blur-sm">
              <h3 className="font-medium text-purple-200 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Available Assignment
              </h3>
              <p className="text-sm text-purple-200/80 mb-3">
                This assignment is available for you to take. Once you take it, you'll be able to chat with the student.
              </p>
              <Button 
                onClick={handleTakeAssignment}
                className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 border-none"
              >
                Take Assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chatPartnerName = userRole === 'student' 
    ? (assignment?.writer?.full_name || assignment?.writer?.email || 'Writer') 
    : (assignment?.user?.full_name || assignment?.user?.email || 'Student');

  const chatPartnerId = userRole === 'student' 
    ? assignment?.writer_id 
    : assignment?.user_id;

  // Status badge styling helper
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-900/30 text-green-200 border-green-700/40';
      case 'in_progress':
        return 'bg-blue-900/30 text-blue-200 border-blue-700/40';
      case 'almost_done':
        return 'bg-teal-900/30 text-teal-200 border-teal-700/40';
      default:
        return 'bg-amber-900/30 text-amber-200 border-amber-700/40';
    }
  };

  // Status display helper
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'completed':
        return <div className="flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Completed</div>;
      case 'in_progress':
        return <div className="flex items-center"><Clock className="w-3 h-3 mr-1" />In Progress</div>;
      case 'almost_done':
        return <div className="flex items-center"><Clock className="w-3 h-3 mr-1" />Almost Done</div>;
      default:
        return <div className="flex items-center"><Info className="w-3 h-3 mr-1" />Submitted</div>;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-purple-300 hover:text-purple-200 hover:bg-purple-900/20">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-6 bg-background/50 backdrop-blur-sm border-purple-800/30">
        <CardHeader className="bg-purple-900/20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Subject: {assignment.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusBadgeClass(assignment.status)}`}>
                {getStatusDisplay(assignment.status)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {assignment.description && (
            <div>
              <h3 className="text-sm font-medium mb-1">Description:</h3>
              <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}
          
          {/* Assignment status update UI for writers */}
          {userRole === 'writer' && assignment.status !== 'completed' && (
            <div className="mt-6 p-4 bg-indigo-900/20 rounded-lg border border-indigo-700/30 backdrop-blur-sm">
              <h4 className="text-sm font-medium mb-2">Update Assignment Status</h4>
              <div className="flex gap-2">
                <Select
                  disabled={isUpdating}
                  value={assignment.status}
                  onValueChange={handleStatusUpdate}
                >
                  <SelectTrigger className="w-[180px] bg-background/30 border-purple-700/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/90 backdrop-blur-sm border-purple-700/30">
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="almost_done">Almost Done</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {isUpdating && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                The student will be notified when you update the status.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-[600px] flex flex-col bg-background/50 backdrop-blur-sm border-purple-800/30">
        <CardHeader className="bg-purple-900/20">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <CardTitle className="text-lg">Chat with {chatPartnerName}</CardTitle>
              {chatPartnerId && <OnlineStatus userId={chatPartnerId} userName={chatPartnerName} />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden">
          {chatRecipientId ? (
            <ChatComponent 
              recipientId={chatRecipientId} 
              assignmentId={assignmentId}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Unable to establish chat connection</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentChatComponent;
