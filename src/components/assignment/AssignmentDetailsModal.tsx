
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Assignment } from '@/hooks/useAssignments';
import FileAttachments from './FileAttachments';
import { Calendar, Clock, BookOpen, User, Circle, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AssignmentDetailsModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
}

const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  assignment,
  isOpen,
  onClose
}) => {
  if (!assignment) {
    return null;
  }

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Use student information directly from assignment
  const studentName = assignment.student_name || 'Anonymous Student';
  const studentEmail = assignment.student_email || 'No email provided';
  const studentPhone = assignment.student_phone || 'No phone number provided';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1">
            <BookOpen className="h-4 w-4 text-muted-foreground" /> 
            <span>{assignment.subject}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-wrap gap-3">
            <Badge className={`text-xs px-3 py-1 ${getStatusBadgeClass(assignment.status)}`}>
              Status: {assignment.status.replace('_', ' ')}
            </Badge>
            
            {assignment.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Due: {formatDate(assignment.due_date)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created: {formatDate(assignment.created_at)}</span>
            </div>
            
            {assignment.completed_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Completed: {formatDate(assignment.completed_date)}</span>
              </div>
            )}
          </div>
          
          {/* Enhanced student information display */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="font-medium text-base mb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-500" />
              Student Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <span className="font-medium text-sm">Name:</span>
                  <span className="ml-2 text-sm">{studentName}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <span className="font-medium text-sm">Email:</span>
                  <span className="ml-2 text-sm">{studentEmail}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <span className="font-medium text-sm">Phone:</span>
                  <span className="ml-2 text-sm">{studentPhone}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-base mb-2">Description</h3>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {assignment.description || "No description provided."}
            </div>
          </div>
          
          {assignment.file_urls && assignment.file_urls.length > 0 && (
            <FileAttachments fileUrls={assignment.file_urls} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailsModal;
