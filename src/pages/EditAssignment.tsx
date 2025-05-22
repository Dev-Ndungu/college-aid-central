
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignments } from '@/hooks/useAssignments';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';

const EditAssignment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const { activeAssignments, updateAssignment, deleteAssignment } = useAssignments();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the current user is a writer
  const isWriter = userRole === 'writer';
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Find the assignment in the activeAssignments
    if (activeAssignments.length > 0 && id) {
      const assignment = activeAssignments.find(a => a.id === id);
      if (assignment) {
        setTitle(assignment.title || '');
        setDescription(assignment.description || '');
        setSubject(assignment.subject || '');
        setDueDate(assignment.due_date ? assignment.due_date.split('T')[0] : '');
        setProgress(assignment.progress || 0);
        setIsLoading(false);
      } else {
        toast.error("Assignment not found");
        navigate('/dashboard');
      }
    }
  }, [id, isAuthenticated, navigate, activeAssignments]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const updates = {
        title,
        description,
        subject,
        due_date: dueDate || null,
        progress: progress,
        updated_at: new Date().toISOString()
      };
      
      if (id) {
        const success = await updateAssignment(id, updates);
        
        if (success) {
          toast.success("Assignment updated successfully");
          navigate('/dashboard');
        } else {
          toast.error("Failed to update assignment");
        }
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      const success = await deleteAssignment(id);
      
      if (success) {
        toast.success("Assignment deleted successfully");
        navigate('/dashboard');
      } else {
        toast.error("Failed to delete assignment");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Loading Assignment...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Edit Assignment</CardTitle>
              <CardDescription>Update your assignment details</CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-5 w-5" />
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
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
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
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Assignment title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your assignment requirements"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            
            {/* Progress Slider - only visible to writers */}
            {isWriter && (
              <div className="space-y-4 pt-2">
                <div className="border-t border-gray-200 pt-4">
                  <Label htmlFor="progress" className="flex justify-between">
                    <span>Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </Label>
                  <div className="pt-2">
                    <Slider
                      id="progress"
                      min={0}
                      max={100}
                      step={5}
                      value={[progress]}
                      onValueChange={(values) => setProgress(values[0])}
                      className="py-4"
                    />
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                'Update Assignment'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditAssignment;
