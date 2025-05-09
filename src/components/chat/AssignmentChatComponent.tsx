
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatComponent from '@/components/chat/ChatComponent';
import { supabase } from "@/integrations/supabase/client";
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { ChevronLeft, Clock, CheckCircle, Info } from 'lucide-react';

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
}

const AssignmentChatComponent = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<AssignmentWithWriter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('assignments')
          .select(`
            *,
            writer:profiles!assignments_writer_id_fkey(id, full_name, email),
            user:profiles!assignments_user_id_fkey(id, full_name, email)
          `)
          .eq('id', assignmentId)
          .single();

        if (error) throw error;

        // Transform the data to match our expected type
        const transformedData: AssignmentWithWriter = {
          ...data,
          writer: data.writer ? (Array.isArray(data.writer) ? data.writer[0] : data.writer) : null,
          user: data.user ? (Array.isArray(data.user) ? data.user[0] : data.user) : null
        };

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

  // Check if the assignment has been taken by a writer
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

  const chatPartnerName = userRole === 'student' 
    ? (assignment.writer?.full_name || assignment.writer?.email || 'Writer') 
    : (assignment.user?.full_name || assignment.user?.email || 'Student');

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader className="bg-muted/50">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Subject: {assignment.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium
                ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                  'bg-amber-100 text-amber-800'}`}>
                {assignment.status === 'completed' ? (
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </div>
                ) : assignment.status === 'in_progress' ? (
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    In Progress
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    Submitted
                  </div>
                )}
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
        </CardContent>
      </Card>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="bg-muted/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Chat with {chatPartnerName}</CardTitle>
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
