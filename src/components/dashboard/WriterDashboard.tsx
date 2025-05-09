
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  Calendar,
  Briefcase,
  Loader,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { useWriters } from '@/hooks/useWriters';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// Render stars
const renderStars = (rating: number) => {
  return Array(5)
    .fill(0)
    .map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 22 20"
      >
        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
      </svg>
    ));
};

const WriterDashboard = () => {
  const { activeAssignments, completedAssignments, isLoading, error, fetchAssignments } = useAssignments();
  const { checkAssignments } = useWriters();
  const { toast } = useToast();
  const { userId } = useAuth();
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // CRITICAL: Improved assignment filtering with better logging
  // Available assignments = status 'submitted' AND writer_id is NULL
  const availableAssignments = activeAssignments.filter(a => {
    const isAvailable = a.status === 'submitted' && !a.writer_id;
    if (isAvailable) {
      console.log('Found available assignment:', a.id, a.title);
    }
    return isAvailable;
  });
  
  // Current assignments = has writer_id matching current user AND status is either 'in-progress' or 'review'
  const currentAssignments = activeAssignments.filter(a => {
    const isCurrentForWriter = a.writer_id === userId && 
      (a.status === 'in-progress' || a.status === 'review');
    return isCurrentForWriter;
  });

  // Enhanced debug function to provide more comprehensive information
  const runDebugCheck = async () => {
    try {
      setDebugInfo("Running comprehensive debug check...");
      
      // Get user profile and role information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId || '')
        .single();
        
      if (profileError) {
        setDebugInfo("Error fetching profile: " + profileError.message);
        return;
      }
      
      // Check if the current user has the writer role
      if (profile?.role !== 'writer') {
        setDebugInfo(`User has role '${profile?.role}' instead of 'writer'. This may affect assignment visibility.`);
      }
      
      // Check if there are assignments in the database
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');
      
      if (assignmentsError) {
        setDebugInfo("Error fetching assignments: " + assignmentsError.message);
        return;
      }
      
      if (!allAssignments || allAssignments.length === 0) {
        setDebugInfo("No assignments found in database. Please create some assignments first.");
        return;
      }
      
      // ENHANCED: Check specifically for submitted assignments with no writer
      const { data: availableAssignments, error: availableError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'submitted')
        .is('writer_id', null);
      
      if (availableError) {
        setDebugInfo("Error fetching submitted assignments: " + availableError.message);
        return;
      }
      
      // ENHANCED: Direct query for all assignments with writer_id = current user
      const { data: myAssignments, error: myAssignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('writer_id', userId || '');
        
      if (myAssignmentsError) {
        setDebugInfo("Error fetching my assignments: " + myAssignmentsError.message);
        return;
      }

      // Check for RLS policies by looking at the count of different query results
      let rlsPoliciesInfo = "RLS status: checking through assignment queries";
      
      // Try to check for RLS indirectly by running authorized vs unauthorized queries
      try {
        const assignmentsCountWithoutFilter = allAssignments?.length || 0;
        
        // Check if writers can see their own assignments (role-based filter)
        const { data: writerAssignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('writer_id', userId || '');
          
        const writerAssignmentsCount = writerAssignments?.length || 0;
        
        // Try to infer RLS based on query results
        if (assignmentsCountWithoutFilter > 0) {
          rlsPoliciesInfo = `RLS appears to be working. Writer can see ${writerAssignmentsCount} of their assigned assignments and ${availableAssignments?.length || 0} available assignments out of ${assignmentsCountWithoutFilter} total assignments.`;
        }
      } catch (e) {
        console.error("Error checking RLS status:", e);
        rlsPoliciesInfo = "Could not verify RLS status";
      }
      
      // ENHANCED: Detailed check of all assignments
      let statuses = allAssignments.reduce((acc: any, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});
      
      // ENHANCED: Add more detailed info about the assignments
      const submittedCount = allAssignments.filter(a => a.status === 'submitted').length;
      const submittedWithNoWriterCount = allAssignments.filter(a => a.status === 'submitted' && !a.writer_id).length;
      const assignmentsAssignedToMe = allAssignments.filter(a => a.writer_id === userId).length;
      
      // COMPREHENSIVE DEBUG INFO
      setDebugInfo(`
        === Assignment Statistics ===
        Found ${allAssignments.length} total assignments in database. 
        Status breakdown: ${JSON.stringify(statuses)}
        
        === For Writers ===
        ${submittedCount} assignments have status='submitted'
        ${submittedWithNoWriterCount} assignments have status='submitted' AND writer_id=null (available for taking)
        ${assignmentsAssignedToMe} assignments assigned to current writer
        ${availableAssignments?.length || 0} assignments showing as available from direct query
        
        === User Info ===
        User role: ${profile?.role}
        User ID: ${userId}
        
        === RLS Status ===
        ${rlsPoliciesInfo}
        
        === Example Assignments ===
        Available assignments from direct query:
        ${JSON.stringify(availableAssignments?.slice(0, 2) || [], null, 2)}
        
        Assignments assigned to me:
        ${JSON.stringify(myAssignments?.slice(0, 2) || [], null, 2)}
      `);
      
      toast({
        title: "Debug Information",
        description: `Found ${allAssignments.length} total assignments. ${availableAssignments?.length || 0} available for writers.`,
      });
    } catch (err: any) {
      setDebugInfo(`Error during debug: ${err.message}`);
    }
  };
  
  // ENHANCED: Manually refresh assignments with more detailed logging
  const refreshAssignments = async () => {
    toast({
      title: "Refreshing",
      description: "Fetching the latest assignments...",
    });
    
    try {
      // Double check there are assignments in the system with direct counts
      const { count: totalCount, error: countError } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error counting assignments: " + countError.message
        });
      } else {
        console.log(`Database has ${totalCount || 0} total assignments`);
      }
      
      // Count of available assignments
      const { count: availableCount, error: availableCountError } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')
        .is('writer_id', null);
        
      if (availableCountError) {
        console.error('Error counting available assignments:', availableCountError);
      } else {
        console.log(`Database has ${availableCount || 0} available assignments`);
      }
      
      // Run our debug check to verify assignments
      await checkAssignments();
      
      // Fetch the assignments to update the UI with forced refresh
      await fetchAssignments();
      
      toast({
        title: "Refreshed",
        description: `Found ${totalCount || 0} assignments (${availableCount || 0} available)`,
      });
      
      // Force component re-render
      setProcessing("refreshing");
      setTimeout(() => setProcessing(null), 100);
      
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error refreshing: " + err.message
      });
    }
  };
  
  useEffect(() => {
    // Check on mount
    console.log("Writer dashboard mounted, active assignments:", activeAssignments);
    console.log("Available assignments:", availableAssignments.length);
    console.log("Current assignments:", currentAssignments.length);
    
    // Run debug check on mount to help diagnose issues
    runDebugCheck();
    
    // Force a refresh to make sure we have the latest data
    fetchAssignments();
  }, []);

  const takeAssignment = async (assignmentId: string) => {
    setProcessing(assignmentId);
    try {
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User information not available. Please log in again."
        });
        setProcessing(null);
        return;
      }

      // Update the assignment to assign it to this writer
      const { data, error } = await supabase
        .from('assignments')
        .update({ 
          status: 'in-progress',
          writer_id: userId 
        })
        .eq('id', assignmentId)
        .select();

      if (error) {
        if (error.message.includes("writer_id")) {
          toast({
            variant: "destructive",
            title: "Assignment Already Taken",
            description: "This assignment has already been taken by another writer."
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Assignment Taken",
          description: "You have successfully taken this assignment."
        });
        // Force refresh of assignments
        await checkAssignments();
        fetchAssignments();
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to take assignment."
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleViewDetails = (assignment: any) => {
    setSelectedAssignment(assignment);
    setViewingAssignment(assignment.id);
  };

  const closeDialog = () => {
    setViewingAssignment(null);
    setSelectedAssignment(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Writer Dashboard</h2>
        <div className="space-x-2">
          <Button 
            onClick={runDebugCheck}
            variant="outline" 
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Debug
          </Button>
          <Button 
            onClick={refreshAssignments}
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Debug Information
            </h3>
            <p className="whitespace-pre-wrap">{debugInfo}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDebugInfo(null)}
            className="text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
              Available Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{availableAssignments.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              Current Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currentAssignments.length}</p>
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
      </div>

      <Tabs defaultValue="available" className="mb-8">
        <TabsList>
          <TabsTrigger value="available">Available Jobs</TabsTrigger>
          <TabsTrigger value="current">Current Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="mt-6">
          {availableAssignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-gray-500">No available jobs found</p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshAssignments}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={runDebugCheck}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Debug
                  </Button>
                </div>
                {debugInfo && (
                  <div className="mt-4 text-xs text-left bg-gray-50 p-3 rounded overflow-auto max-h-60">
                    <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {availableAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>{assignment.subject}</CardDescription>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        ${Math.floor((assignment.title?.length || 0) * 0.8) + 50}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-gray-700">Due: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-gray-700">Words: {Math.floor((assignment.description?.length || 0) * 0.2) + 1000}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-gray-700">Complexity: {
                          assignment.title?.length > 30 ? "High" : assignment.title?.length > 20 ? "Medium" : "Low"
                        }</span>
                      </div>
                    </div>
                    {assignment.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700 line-clamp-3">{assignment.description}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(assignment)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      disabled={processing === assignment.id}
                      onClick={() => takeAssignment(assignment.id)}
                    >
                      {processing === assignment.id ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Taking...
                        </>
                      ) : (
                        'Take Assignment'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="current" className="mt-6">
          {currentAssignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-gray-500">No current jobs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {currentAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>{assignment.subject}</CardDescription>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        ${Math.floor((assignment.title?.length || 0) * 0.8) + 50}
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
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {formatDate(assignment.due_date)}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleViewDetails(assignment)}>
                      View Details
                    </Button>
                    <Button size="sm">
                      Update Progress
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
                <p className="text-gray-500">No completed jobs found</p>
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
                        ${Math.floor((assignment.title?.length || 0) * 0.8) + 50}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        Completed: {formatDate(assignment.completed_date)}
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Client Rating:</span>
                        <div className="flex items-center">
                          {renderStars(4)} {/* Mock rating */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(assignment)}>
                      View Assignment
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assignment Details Dialog */}
      <Dialog open={!!viewingAssignment} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{selectedAssignment?.title}</span>
              <Button variant="ghost" size="icon" onClick={closeDialog}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAssignment?.status || '')}`}>
                    {getStatusLabel(selectedAssignment?.status || '')}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <p className="mt-1">{formatDate(selectedAssignment?.due_date)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
              <div className="bg-gray-50 rounded-md p-4 text-sm">
                {selectedAssignment?.description || 'No description provided.'}
              </div>
            </div>
            
            {selectedAssignment?.progress !== null && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <p className="text-sm font-medium text-gray-500">Progress</p>
                  <span>{selectedAssignment?.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-brand-500 h-2.5 rounded-full" 
                    style={{ width: `${selectedAssignment?.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <Button variant="outline" onClick={closeDialog}>Close</Button>
            {selectedAssignment && !selectedAssignment.writer_id && selectedAssignment.status === 'submitted' && (
              <Button 
                disabled={processing === selectedAssignment?.id}
                onClick={() => {
                  takeAssignment(selectedAssignment.id);
                  closeDialog();
                }}
              >
                Take Assignment
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WriterDashboard;
