
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Clock, CheckCircle, CalendarDays, BookOpen, MessageCircle } from "lucide-react";
import { Assignment, useAssignments } from '@/hooks/useAssignments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const StudentDashboard = () => {
  const { activeAssignments, completedAssignments, isLoading, deleteAssignment } = useAssignments();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      await deleteAssignment(id);
      toast.success("Assignment deleted successfully");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const ActiveAssignments = () => {
    if (activeAssignments.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium">No Active Assignments</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            You haven't submitted any assignments yet. Click the "New Assignment" button to get started.
          </p>
          <Button onClick={() => navigate('/submit-assignment')} className="mt-4">
            Submit New Assignment
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Assignment</th>
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Due Date</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeAssignments.map(assignment => (
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
                    <AssignmentStatusBadge status={assignment.status} />
                  </td>
                  <td className="p-3">
                    {assignment.due_date ? 
                      new Date(assignment.due_date).toLocaleDateString() : 
                      'Not set'
                    }
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {/* Show chat button only if the assignment has been taken by a writer */}
                      {assignment.writer_id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/assignment-chat/${assignment.id}`)}
                        >
                          <MessageCircle className="mr-1 h-3 w-3" />
                          Chat with Writer
                        </Button>
                      )}
                      
                      {/* Only allow editing if the assignment is still in submitted status */}
                      {assignment.status === 'submitted' && !assignment.writer_id && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8" 
                          onClick={() => navigate(`/edit-assignment/${assignment.id}`)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this assignment? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(assignment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isDeleting && deleteId === assignment.id}
                            >
                              {isDeleting && deleteId === assignment.id ? (
                                <>
                                  <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
            You don't have any completed assignments yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Assignment</th>
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Completed Date</th>
                <th className="p-3 text-left font-medium">Grade</th>
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
                  <td className="p-3">{assignment.grade || 'Not graded'}</td>
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
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="w-full">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Active Assignments</CardTitle>
              <CardDescription>
                Assignments that are in progress or awaiting a writer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
                </div>
              ) : (
                <ActiveAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="w-full">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Completed Assignments</CardTitle>
              <CardDescription>
                Assignments that have been completed by writers.
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

const AssignmentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'submitted':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <Clock className="mr-1 h-3 w-3" /> Submitted
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="mr-1 h-3 w-3" /> In Progress
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" /> Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export default StudentDashboard;
