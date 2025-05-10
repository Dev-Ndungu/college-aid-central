
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Assignment, useAssignments } from '@/hooks/useAssignments';
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const WriterDashboard = () => {
  const { activeAssignments, completedAssignments, isLoading, takeAssignment, updateAssignment } = useAssignments();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [updatingProgressIds, setUpdatingProgressIds] = useState<Set<string>>(new Set());
  const { userId } = useAuth();
  const navigate = useNavigate();

  const handleTakeAssignment = async (assignmentId: string) => {
    // Add this assignment to processing state
    setProcessingIds(prev => new Set(prev).add(assignmentId));
    
    try {
      const result = await takeAssignment(assignmentId);
      if (result) {
        toast.success('Assignment taken successfully!');
        // Navigate to the chat page for this assignment
        navigate(`/assignment-chat/${assignmentId}`);
      }
    } catch (error) {
      console.error('Error taking assignment:', error);
      toast.error('Failed to take assignment');
    } finally {
      // Remove from processing state
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (assignmentId: string, status: string) => {
    // Add this assignment to updating progress state
    setUpdatingProgressIds(prev => new Set(prev).add(assignmentId));
    
    try {
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
      
      await updateAssignment(assignmentId, updates);

      // Find the assignment user_id to send notification
      const assignment = activeAssignments.find(a => a.id === assignmentId);
      
      if (assignment && assignment.user_id) {
        // Send notification to student about status change
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
              assignment_id: assignmentId,
              read: false
            });
        }
      }
      
      toast.success(`Assignment status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Failed to update assignment status');
    } finally {
      // Remove from updating state
      setUpdatingProgressIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentId);
        return newSet;
      });
    }
  };

  // Status badge styling helper
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'almost_done':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
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
        return "Submitted";
    }
  };

  const AvailableAssignments = () => {
    // Filter for assignments that have not been taken yet
    const availableAssignments = activeAssignments.filter(
      assignment => assignment.status === 'submitted' && !assignment.writer_id
    );

    if (availableAssignments.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 dark:bg-gray-800">
            <BookOpen className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No Available Assignments</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            There are currently no available assignments to take. Check back later!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-purple-900/20 border border-purple-700/30 p-3 rounded-lg text-sm backdrop-blur-sm">
          <h3 className="font-medium mb-1 text-purple-200">Available Assignments</h3>
          <p className="text-purple-200/70 text-xs">
            These assignments have been submitted by students and are available for you to take.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-purple-900/30">
              <tr>
                <th className="p-3 text-left font-medium text-purple-100">Assignment</th>
                <th className="p-3 text-left font-medium text-purple-100">Subject</th>
                <th className="p-3 text-left font-medium text-purple-100">Status</th>
                <th className="p-3 text-left font-medium text-purple-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-700/20">
              {availableAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b border-purple-700/20">
                  <td className="p-3">
                    <div className="font-medium text-purple-200">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-purple-200/70 mt-1 line-clamp-2">
                        {assignment.description}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-purple-200">{assignment.subject}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-200 border border-amber-700/40">
                      Submitted
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleTakeAssignment(assignment.id)}
                        disabled={processingIds.has(assignment.id)}
                        size="sm"
                        className="bg-gradient-to-br from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900"
                      >
                        {processingIds.has(assignment.id) 
                          ? <span className="flex items-center gap-1">
                              <span className="animate-spin h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full mr-1"></span>
                              Processing...
                            </span>
                          : 'Take Assignment'
                        }
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assignment-chat/${assignment.id}`)}
                        className="border-purple-700/30 text-purple-200 hover:bg-purple-900/30"
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const MyAssignments = () => {
    // Filter for assignments that have been taken by this writer
    const myAssignments = activeAssignments.filter(
      assignment => assignment.writer_id === userId && assignment.status !== 'completed'
    );

    if (myAssignments.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 dark:bg-gray-800">
            <Clock className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No Active Assignments</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            You haven't taken any assignments yet. Browse available assignments to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-700/30 text-sm backdrop-blur-sm">
          <h3 className="font-medium mb-1 text-indigo-200">My Active Assignments</h3>
          <p className="text-indigo-200/70 text-xs">
            These are assignments you've taken and are currently working on.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-purple-900/30">
              <tr>
                <th className="p-3 text-left font-medium text-purple-100">Assignment</th>
                <th className="p-3 text-left font-medium text-purple-100">Subject</th>
                <th className="p-3 text-left font-medium text-purple-100">Status</th>
                <th className="p-3 text-left font-medium text-purple-100">Update Progress</th>
                <th className="p-3 text-left font-medium text-purple-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-700/20">
              {myAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b border-purple-700/20">
                  <td className="p-3">
                    <div className="font-medium text-purple-200">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-purple-200/70 mt-1 line-clamp-2">
                        {assignment.description}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-purple-200">{assignment.subject}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusBadgeClass(assignment.status)}`}>
                      {getStatusDisplay(assignment.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={assignment.status}
                        onValueChange={(value) => handleStatusUpdate(assignment.id, value)}
                        disabled={updatingProgressIds.has(assignment.id)}
                      >
                        <SelectTrigger className="w-[140px] bg-purple-900/20 border-purple-700/30 text-purple-200">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/90 backdrop-blur-sm border-purple-700/30">
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="almost_done">Almost Done</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingProgressIds.has(assignment.id) && (
                        <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assignment-chat/${assignment.id}`)}
                        className="border-purple-700/30 text-purple-200 hover:bg-purple-900/30"
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Chat with Student
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const CompletedAssignments = () => {
    if (completedAssignments.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 dark:bg-gray-800">
            <CheckCircle className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No Completed Assignments</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            You haven't completed any assignments yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-green-900/20 p-3 rounded-lg border border-green-700/30 text-sm backdrop-blur-sm">
          <h3 className="font-medium mb-1 text-green-200">Completed Assignments</h3>
          <p className="text-green-200/70 text-xs">
            These are assignments you've successfully completed.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-purple-900/30">
              <tr>
                <th className="p-3 text-left font-medium text-purple-100">Assignment</th>
                <th className="p-3 text-left font-medium text-purple-100">Subject</th>
                <th className="p-3 text-left font-medium text-purple-100">Completed Date</th>
                <th className="p-3 text-left font-medium text-purple-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-700/20">
              {completedAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b border-purple-700/20">
                  <td className="p-3">
                    <div className="font-medium text-purple-200">{assignment.title}</div>
                  </td>
                  <td className="p-3 text-purple-200">{assignment.subject}</td>
                  <td className="p-3 text-purple-200">
                    {assignment.completed_date ? 
                      new Date(assignment.completed_date).toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td className="p-3">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/assignment-chat/${assignment.id}`)}
                      className="border-purple-700/30 text-purple-200 hover:bg-purple-900/30"
                    >
                      <MessageCircle className="mr-1 h-3 w-3" />
                      View Messages
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 bg-purple-900/40 border border-purple-700/30">
          <TabsTrigger value="available" className="data-[state=active]:bg-purple-700/50">Available</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-purple-700/50">My Assignments</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-purple-700/50">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="w-full">
          <Card className="bg-background/50 backdrop-blur-sm border-purple-800/30">
            <CardHeader className="pb-4 bg-purple-900/20">
              <CardTitle>Available Assignments</CardTitle>
              <CardDescription className="text-purple-200/70">
                Browse assignments submitted by students that are available for you to take.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading assignments...</p>
                </div>
              ) : (
                <AvailableAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="w-full">
          <Card className="bg-background/50 backdrop-blur-sm border-purple-800/30">
            <CardHeader className="pb-4 bg-purple-900/20">
              <CardTitle>My Active Assignments</CardTitle>
              <CardDescription className="text-purple-200/70">
                Assignments you've taken and are currently working on.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading assignments...</p>
                </div>
              ) : (
                <MyAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="w-full">
          <Card className="bg-background/50 backdrop-blur-sm border-purple-800/30">
            <CardHeader className="pb-4 bg-purple-900/20">
              <CardTitle>Completed Assignments</CardTitle>
              <CardDescription className="text-purple-200/70">
                Assignments you've successfully completed.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading assignments...</p>
                </div>
              ) : (
                <CompletedAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WriterDashboard;
