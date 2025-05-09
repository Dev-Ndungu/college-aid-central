
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  Calendar,
  Briefcase,
  Loader,
  X,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkDatabaseConfig } from '@/utils/dbCheck';
import { format } from 'date-fns';

// Define Assignment type
type Assignment = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  status: string;
  progress: number | null;
  due_date: string | null;
  completed_date: string | null;
  grade: string | null;
  created_at: string | null;
  writer_id?: string | null;
  user_id: string;
};

// Status formatting utilities
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

// Format date for display
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Not set';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};

const WriterDashboard = () => {
  const { userId } = useAuth();
  const [availableAssignments, setAvailableAssignments] = useState<Assignment[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<string | null>(null);

  // Fetch all assignments for writers
  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching assignments for writer with ID:', userId);

      // Direct DB check
      const dbCheck = await checkDatabaseConfig();
      console.log('Database check result:', dbCheck);
      
      // STEP 1: Fetch available assignments (status='submitted', no writer assigned)
      const { data: available, error: availableError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'submitted')
        .is('writer_id', null);
        
      if (availableError) {
        console.error('Error fetching available assignments:', availableError);
        setError(`Failed to fetch available assignments: ${availableError.message}`);
        return;
      }
      
      console.log('Available assignments fetched:', available?.length || 0);
      setAvailableAssignments(available || []);

      // STEP 2: Fetch writer's current assignments
      if (userId) {
        const { data: current, error: currentError } = await supabase
          .from('assignments')
          .select('*')
          .eq('writer_id', userId)
          .in('status', ['in-progress', 'review']);
          
        if (currentError) {
          console.error('Error fetching current assignments:', currentError);
          setError(`Failed to fetch current assignments: ${currentError.message}`);
          return;
        }
        
        console.log('Current assignments fetched:', current?.length || 0);
        setCurrentAssignments(current || []);
      }

      // STEP 3: Fetch completed assignments
      if (userId) {
        const { data: completed, error: completedError } = await supabase
          .from('assignments')
          .select('*')
          .eq('writer_id', userId)
          .eq('status', 'completed');
          
        if (completedError) {
          console.error('Error fetching completed assignments:', completedError);
          setError(`Failed to fetch completed assignments: ${completedError.message}`);
          return;
        }
        
        console.log('Completed assignments fetched:', completed?.length || 0);
        setCompletedAssignments(completed || []);
      }

    } catch (err: any) {
      console.error('Error in fetchAssignments:', err);
      setError(`Error: ${err.message}`);
      toast.error('Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  // Take assignment functionality
  const takeAssignment = async (assignmentId: string) => {
    if (!userId) {
      toast.error('You must be logged in to take assignments');
      return;
    }
    
    setProcessing(assignmentId);
    try {
      // Update the assignment to assign it to this writer
      const { data, error } = await supabase
        .from('assignments')
        .update({ 
          status: 'in-progress',
          writer_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .is('writer_id', null) // Ensure it's not already assigned
        .select();

      if (error) {
        console.error('Error taking assignment:', error);
        toast.error(error.message || 'Failed to take assignment');
        return;
      }
      
      toast.success('Assignment successfully taken');
      
      // Refresh assignments
      await fetchAssignments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to take assignment');
    } finally {
      setProcessing(null);
    }
  };

  // Debug RLS and database issues
  const runDebugCheck = async () => {
    setProcessing('debug');
    try {
      // 1. Check database configuration
      const dbCheck = await checkDatabaseConfig();
      
      // 2. Direct count of submissions in DB
      const { count: submittedCount, error: countError } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');
        
      // 3. Check user role
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId || '')
        .single();

      // Compile debug info
      const debugText = `
WRITER DASHBOARD DEBUG INFO:
---------------------------
Database check: ${dbCheck.success ? 'Success' : 'Failed'} - ${dbCheck.message}
User ID: ${userId || 'Not available'}
User role: ${userProfile?.role || 'Unknown'}
Submitted assignments in DB: ${submittedCount || 'Error fetching count'}
Available assignments fetched: ${availableAssignments.length}
Current assignments fetched: ${currentAssignments.length}
Completed assignments fetched: ${completedAssignments.length}
${countError ? 'Count error: ' + countError.message : ''}
${profileError ? 'Profile error: ' + profileError.message : ''}
      `;
      
      setDebugInfo(debugText);
      console.log(debugText);
      
    } catch (err: any) {
      setDebugInfo(`Error running debug check: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  // Create test assignment for debugging
  const createTestAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          title: `Test Assignment ${new Date().getTime()}`,
          subject: 'Test Subject',
          description: 'This is a test assignment created for debugging purposes.',
          status: 'submitted',
          user_id: userId || '',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .select();
        
      if (error) {
        toast.error(`Failed to create test assignment: ${error.message}`);
        return;
      }
      
      toast.success('Test assignment created');
      await fetchAssignments();
      
    } catch (err: any) {
      toast.error(`Error creating test assignment: ${err.message}`);
    }
  };

  // View assignment details
  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setViewingAssignment(assignment.id);
  };

  // Close assignment details dialog
  const closeDialog = () => {
    setViewingAssignment(null);
    setSelectedAssignment(null);
  };

  // Effect for initial data fetching
  useEffect(() => {
    fetchAssignments();
    
    // Set up real-time subscription for assignment changes
    const assignmentsSubscription = supabase
      .channel('assignments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignments' }, 
        (payload) => {
          console.log('Assignment change detected:', payload);
          fetchAssignments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(assignmentsSubscription);
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Writer Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            onClick={runDebugCheck}
            variant="outline" 
            size="sm"
            disabled={processing === 'debug'}
            className="flex items-center gap-1"
          >
            {processing === 'debug' ? (
              <Loader className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-1" />
            )}
            Debug
          </Button>
          <Button 
            onClick={fetchAssignments}
            variant="outline" 
            size="sm"
            disabled={processing === 'refresh'}
            className="flex items-center gap-1"
          >
            {processing === 'refresh' ? (
              <Loader className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
          <Button
            onClick={createTestAssignment}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Create Test
          </Button>
        </div>
      </div>

      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Debug Information
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDebugInfo(null)}
              className="text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-xs mt-2 bg-white p-3 rounded border border-blue-100 overflow-auto max-h-80">
            {debugInfo}
          </pre>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1">{error}</p>
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
                    onClick={fetchAssignments}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>{formatDate(assignment.due_date)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                          {getStatusLabel(assignment.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(assignment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            disabled={processing === assignment.id}
                            onClick={() => takeAssignment(assignment.id)}
                          >
                            {processing === assignment.id ? 'Taking...' : 'Take'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>{formatDate(assignment.due_date)}</TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-brand-500 h-2.5 rounded-full" 
                            style={{ width: `${assignment.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1">{assignment.progress || 0}%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(assignment)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>{formatDate(assignment.completed_date)}</TableCell>
                      <TableCell>{assignment.grade || 'Not graded'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(assignment)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
