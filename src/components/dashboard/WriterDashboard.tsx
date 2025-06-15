import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Assignment, useAssignments } from '@/hooks/useAssignments';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, CheckCircle, Clock, Eye, User, Calendar, Mail, Phone, UserCheck, UserX, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import AssignmentDetailsModal from '../assignment/AssignmentDetailsModal';
import { format, formatRelative } from 'date-fns';
import WriterEmailModal from './WriterEmailModal';
import ContactMessagesModal from './ContactMessagesModal';
import PriceInput from '../assignment/PriceInput';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const WriterDashboard = () => {
  const {
    activeAssignments,
    completedAssignments,
    isLoading,
    takeAssignment,
    updateAssignment
  } = useAssignments();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [updatingProgressIds, setUpdatingProgressIds] = useState<Set<string>>(new Set());
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [emailingAssignment, setEmailingAssignment] = useState<Assignment | null>(null);
  const [showContactMessages, setShowContactMessages] = useState(false);
  const {
    userId,
    userEmail
  } = useAuth();
  const navigate = useNavigate();

  // Only show contact messages button for specific writer emails
  const showMessagesButton = userEmail === 'worldwritingfoundation@gmail.com' || userEmail === 'write.mefoundation@gmail.com';

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Format relative date helper
  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return formatRelative(new Date(dateString), new Date());
  };

  const handleTakeAssignment = async (assignmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(assignmentId));
    try {
      // Get writer profile data to include in the notification
      const { data: writerData, error: writerError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .single();
        
      if (writerError) {
        console.error('Error fetching writer data:', writerError);
      }
      
      const result = await takeAssignment(assignmentId, writerData);
      if (result) {
        toast.success('Assignment taken successfully!');
        navigate(`/assignment-chat/${assignmentId}`);
      }
    } catch (error) {
      console.error('Error taking assignment:', error);
      toast.error('Failed to take assignment');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (assignmentId: string, status: string) => {
    setUpdatingProgressIds(prev => new Set(prev).add(assignmentId));
    try {
      const updates: {
        status: string;
        completed_date?: string | null;
        updated_at: string;
      } = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updates.completed_date = new Date().toISOString();
      } else {
        updates.completed_date = null;
      }
      
      await updateAssignment(assignmentId, updates);
      toast.success(`Assignment status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Failed to update assignment status');
    } finally {
      setUpdatingProgressIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentId);
        return newSet;
      });
    }
  };

  const handlePriceUpdate = async (assignmentId: string, price: number) => {
    try {
      const updates = {
        price,
        updated_at: new Date().toISOString()
      };
      
      await updateAssignment(assignmentId, updates);
      
      // Send price update notification to student
      try {
        const response = await fetch(`https://ihvgtaxvrqdnrgdddhdx.supabase.co/functions/v1/notify-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'price_update',
            assignment_id: assignmentId,
            price: price
          }),
        });

        if (!response.ok) {
          console.error('Failed to send price update notification');
        }
      } catch (notificationError) {
        console.error('Error sending price update notification:', notificationError);
      }
      
      toast.success('Price updated successfully');
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  };

  // Status badge styling helper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
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
    switch (status) {
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

  const handleViewAssignment = (assignment: Assignment) => {
    setViewingAssignment(assignment);
  };

  const handleOpenEmailModal = (assignment: Assignment) => {
    setEmailingAssignment(assignment);
  };

  // Student information display component
  const StudentInformation = ({ assignment }: { assignment: Assignment }) => {
    if (assignment.is_verified_account) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-sm font-medium">
            <User className="h-3 w-3 mr-1 text-gray-500" />
            {assignment.student_name || 'Student'}
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <UserCheck className="h-3 w-3 mr-1" />
              Has Account
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Mail className="h-3 w-3 mr-1" />
            {assignment.student_email}
          </div>
          {assignment.student_phone && (
            <div className="flex items-center text-xs text-gray-500">
              <Phone className="h-3 w-3 mr-1" />
              {assignment.student_phone}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-sm font-medium">
            <User className="h-3 w-3 mr-1 text-gray-500" />
            {assignment.student_name || 'Anonymous Student'}
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <UserX className="h-3 w-3 mr-1" />
              No Account
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Mail className="h-3 w-3 mr-1" />
            {assignment.student_email || 'No email provided'}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Phone className="h-3 w-3 mr-1" />
            {assignment.student_phone || 'No phone provided'}
          </div>
        </div>
      );
    }
  };

  const AvailableAssignments = () => {
    const availableAssignments = activeAssignments.filter(assignment => 
      assignment.status === 'submitted' && !assignment.writer_id
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
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Student Information</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableAssignments.map(assignment => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="font-medium text-gray-800">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {assignment.description}
                      </div>
                    )}
                    {assignment.file_urls && assignment.file_urls.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {assignment.file_urls.length} attachment{assignment.file_urls.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-700">{assignment.subject}</TableCell>
                  <TableCell>
                    <StudentInformation assignment={assignment} />
                  </TableCell>
                  <TableCell className="text-gray-600 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span title={formatDate(assignment.created_at)}>
                        {formatRelativeDate(assignment.created_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      Submitted
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleTakeAssignment(assignment.id)} 
                        disabled={processingIds.has(assignment.id)} 
                        size="sm"
                      >
                        {processingIds.has(assignment.id) ? (
                          <span className="flex items-center gap-1">
                            <span className="animate-spin h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full mr-1"></span>
                            Processing...
                          </span>
                        ) : (
                          'Take Assignment'
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewAssignment(assignment)}>
                        <Eye className="mr-1 h-3 w-3" />
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const MyAssignments = () => {
    const myAssignments = activeAssignments.filter(assignment => 
      assignment.writer_id === userId && assignment.status !== 'completed'
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
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Student Information</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myAssignments.map(assignment => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="font-medium text-gray-800">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {assignment.description}
                      </div>
                    )}
                    {assignment.file_urls && assignment.file_urls.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {assignment.file_urls.length} attachment{assignment.file_urls.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-700">{assignment.subject}</TableCell>
                  <TableCell>
                    <StudentInformation assignment={assignment} />
                  </TableCell>
                  <TableCell className="text-gray-600 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span title={formatDate(assignment.created_at)}>
                        {formatRelativeDate(assignment.created_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriceInput
                      assignmentId={assignment.id}
                      currentPrice={assignment.price}
                      onPriceUpdate={handlePriceUpdate}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusBadgeClass(assignment.status)}`}>
                      {getStatusDisplay(assignment.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={assignment.status} 
                        onValueChange={(value) => handleStatusUpdate(assignment.id, value)} 
                        disabled={updatingProgressIds.has(assignment.id)}
                      >
                        <SelectTrigger className="w-[140px] bg-white">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="almost_done">Almost Done</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingProgressIds.has(assignment.id) && (
                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewAssignment(assignment)}>
                        <Eye className="mr-1 h-3 w-3" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEmailModal(assignment)}>
                        <Mail className="mr-1 h-3 w-3" />
                        Email Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Student Information</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedAssignments.map(assignment => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="font-medium text-gray-800">{assignment.title}</div>
                    {assignment.file_urls && assignment.file_urls.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {assignment.file_urls.length} attachment{assignment.file_urls.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-700">{assignment.subject}</TableCell>
                  <TableCell>
                    <StudentInformation assignment={assignment} />
                  </TableCell>
                  <TableCell className="text-gray-600 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span title={formatDate(assignment.created_at)}>
                        {formatRelativeDate(assignment.created_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {assignment.price ? `$${assignment.price.toFixed(2)}` : 'Not set'}
                      </span>
                      {assignment.paid && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {assignment.completed_date ? formatDate(assignment.completed_date) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewAssignment(assignment)}>
                        <Eye className="mr-1 h-3 w-3" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEmailModal(assignment)}>
                        <Mail className="mr-1 h-3 w-3" />
                        Email Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-none px-0 container mx-0">
      {/* Contact Messages Button - Only for specific writers */}
      {showMessagesButton && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowContactMessages(true)} className="mb-2">
            <MessageCircle className="mr-2 h-4 w-4" /> View Contact Messages
          </Button>
        </div>
      )}

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 bg-gray-100 border border-gray-200">
          <TabsTrigger value="available" className="data-[state=active]:bg-white">Available</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-white">My Assignments</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-white">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="w-full">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm mb-6">
                These assignments have been submitted by students and are available for you to take.
              </p>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
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
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm mb-6">
                These are assignments you've taken and are currently working on. You can set prices for students.
              </p>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
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
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm mb-6">
                These are assignments you've successfully completed.
              </p>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
                </div>
              ) : (
                <CompletedAssignments />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Details Modal */}
      <AssignmentDetailsModal 
        assignment={viewingAssignment} 
        isOpen={viewingAssignment !== null} 
        onClose={() => setViewingAssignment(null)} 
      />

      {/* Email Student Modal */}
      <WriterEmailModal 
        assignment={emailingAssignment} 
        isOpen={emailingAssignment !== null} 
        onClose={() => setEmailingAssignment(null)} 
      />

      {/* Contact Messages Modal */}
      <ContactMessagesModal 
        isOpen={showContactMessages} 
        onClose={() => setShowContactMessages(false)} 
      />
    </div>
  );
};

export default WriterDashboard;
