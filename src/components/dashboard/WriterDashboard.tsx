
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Assignment, useAssignments } from '@/hooks/useAssignments';
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, CheckCircle, Clock, MessageCircle } from 'lucide-react';

const WriterDashboard = () => {
  const { activeAssignments, completedAssignments, isLoading, takeAssignment } = useAssignments();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
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

  const AvailableAssignments = () => {
    // Filter for assignments that have not been taken yet
    const availableAssignments = activeAssignments.filter(
      assignment => assignment.status === 'submitted' && !assignment.writer_id
    );

    if (availableAssignments.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium">No Available Assignments</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            There are currently no available assignments to take. Check back later!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg border text-sm">
          <h3 className="font-medium mb-1">Available Assignments</h3>
          <p className="text-muted-foreground text-xs">
            These assignments have been submitted by students and are available for you to take.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Assignment</th>
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {availableAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </div>
                    )}
                  </td>
                  <td className="p-3">{assignment.subject}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Submitted
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleTakeAssignment(assignment.id)}
                        disabled={processingIds.has(assignment.id)}
                        size="sm"
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
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium">No Active Assignments</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            You haven't taken any assignments yet. Browse available assignments to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
          <h3 className="font-medium mb-1 text-blue-900">My Active Assignments</h3>
          <p className="text-blue-800/70 text-xs">
            These are assignments you've taken and are currently working on.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Assignment</th>
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {myAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </div>
                    )}
                  </td>
                  <td className="p-3">{assignment.subject}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      In Progress
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assignment-chat/${assignment.id}`)}
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
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium">No Completed Assignments</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            You haven't completed any assignments yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm">
          <h3 className="font-medium mb-1 text-green-900">Completed Assignments</h3>
          <p className="text-green-800/70 text-xs">
            These are assignments you've successfully completed.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Assignment</th>
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Completed Date</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {completedAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{assignment.title}</div>
                  </td>
                  <td className="p-3">{assignment.subject}</td>
                  <td className="p-3">
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
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="active">My Assignments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="w-full">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Available Assignments</CardTitle>
              <CardDescription>
                Browse assignments submitted by students that are available for you to take.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
                </div>
              ) : (
                <AvailableAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="w-full">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>My Active Assignments</CardTitle>
              <CardDescription>
                Assignments you've taken and are currently working on.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
                </div>
              ) : (
                <MyAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="w-full">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Completed Assignments</CardTitle>
              <CardDescription>
                Assignments you've successfully completed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
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
