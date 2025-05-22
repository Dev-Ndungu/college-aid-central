
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, BookOpen, User, Circle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import FileAttachments from './FileAttachments';
import { Progress } from '@/components/ui/progress';

interface AssignmentDetailsProps {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  due_date: string | null;
  status: string;
  progress: number | null;
  writer?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  file_urls?: string[] | null;
  onAssignmentClick?: (id: string) => void;
  onTakeAssignment?: (id: string) => void;
  actionButton?: React.ReactNode;
}

const AssignmentDetailsCard: React.FC<AssignmentDetailsProps> = ({
  id,
  title,
  subject,
  description,
  due_date,
  status,
  progress,
  writer,
  file_urls,
  onAssignmentClick,
  onTakeAssignment,
  actionButton
}) => {
  // Format due date for display
  const formattedDueDate = due_date 
    ? isToday(new Date(due_date))
      ? 'Today'
      : isTomorrow(new Date(due_date))
        ? 'Tomorrow'
        : isYesterday(new Date(due_date))
          ? 'Yesterday'
          : format(new Date(due_date), 'MMM d, yyyy')
    : 'No due date';
  
  // Format time separately
  const formattedDueTime = due_date 
    ? format(new Date(due_date), 'h:mm a')
    : '';

  // Status indicator
  const getStatusIndicator = () => {
    switch(status) {
      case 'submitted':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500 flex gap-1 items-center">
            <Circle fill="#3b82f6" className="h-2 w-2" />
            Submitted
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500 flex gap-1 items-center">
            <Circle fill="#f59e0b" className="h-2 w-2" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 flex gap-1 items-center">
            <Circle fill="#10b981" className="h-2 w-2" />
            Completed
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="border-red-500 text-red-500 flex gap-1 items-center">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex gap-1 items-center">
            <Circle className="h-2 w-2" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card 
      className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onAssignmentClick && onAssignmentClick(id)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold truncate" title={title}>{title}</CardTitle>
          {getStatusIndicator()}
        </div>
        <CardDescription className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" /> 
          <span className="capitalize">{subject.replace('-', ' ')}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {description}
          </p>
        )}
        
        {/* Add progress bar */}
        {progress !== undefined && progress !== null && (
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress:</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{formattedDueDate}</span>
            {formattedDueTime && (
              <>
                <span className="mx-1 text-gray-400">•</span>
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{formattedDueTime}</span>
              </>
            )}
          </div>
          
          {writer && (
            <div className="flex items-center text-muted-foreground">
              <User className="h-3.5 w-3.5 mr-1" />
              <span>{writer.full_name || writer.email}</span>
            </div>
          )}
        </div>
        
        {/* Display file attachments */}
        {file_urls && file_urls.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center">
            <FileAttachments fileUrls={file_urls} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        {actionButton ? actionButton : onTakeAssignment && status === 'submitted' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onTakeAssignment(id);
            }}
          >
            Take Assignment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AssignmentDetailsCard;
