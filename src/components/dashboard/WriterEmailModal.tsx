
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Mail, Percent } from "lucide-react";
import { toast } from "sonner";
import { Assignment } from '@/hooks/useAssignments';
import { supabase } from '@/integrations/supabase/client';

interface WriterEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
}

const WriterEmailModal = ({ isOpen, onClose, assignment }: WriterEmailModalProps) => {
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);

  // Fetch student profile data if the student has an account
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!assignment || !assignment.is_verified_account || !assignment.user_id) return;
      
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone_number')
          .eq('id', assignment.user_id)
          .single();
          
        if (error) {
          console.error('Error fetching student profile:', error);
          return;
        }
        
        // Update assignment with profile data for the email template
        if (profileData) {
          assignment.student_name = profileData.full_name || assignment.student_name;
          assignment.student_email = profileData.email || assignment.student_email;
          assignment.student_phone = profileData.phone_number || assignment.student_phone;
        }
      } catch (err) {
        console.error('Error in fetchStudentProfile:', err);
      }
    };
    
    if (isOpen && assignment) {
      fetchStudentProfile();
      setProgress(assignment.progress || 0);
    }
  }, [assignment, isOpen]);

  // Reset form when assignment changes or modal opens
  useEffect(() => {
    if (isOpen && assignment) {
      // Create a more detailed email subject
      setSubject(`Update on your assignment: ${assignment.title}`);
      
      // Format assignment details for the email body
      const dueDate = assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Not specified';
      const assignmentProgress = assignment.progress ? `${assignment.progress}%` : 'Not started';
      
      // Create a more detailed email template with assignment details
      const emailBody = `Hello ${assignment.student_name || ''},

I wanted to provide you with an update regarding your assignment "${assignment.title}".

Assignment Details:
- Title: ${assignment.title}
- Subject: ${assignment.subject}
- Due Date: ${dueDate}
- Current Status: ${assignment.status.replace('_', ' ')}
- Progress: ${assignmentProgress}
${assignment.description ? `- Description: ${assignment.description}` : ''}

[Your message to the student here]

You can check your assignment status here: https://assignmenthub.org/dashboard

Best regards,
The Assignment Hub Team`;

      setBody(emailBody);
    }
  }, [assignment, isOpen]);

  const handleSendEmail = async () => {
    if (!assignment || !assignment.student_email) {
      toast.error("Cannot send email - student does not have an email address");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter an email subject");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter an email message");
      return;
    }

    try {
      setIsSending(true);

      // Use the notify-message edge function to send the email
      const projectRef = "ihvgtaxvrqdnrgdddhdx";
      
      // Get writer details - but we won't show them to the student
      const { data: writerData, error: writerError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', assignment.writer_id)
        .single();
        
      if (writerError) {
        console.error('Error fetching writer data:', writerError);
        toast.error("Failed to get writer details");
        setIsSending(false);
        return;
      }

      const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/notify-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'writer_direct_email',
          recipient: {
            email: assignment.student_email,
            name: assignment.student_name || 'Student'
          },
          sender: {
            ...writerData,
            full_name: 'Assignment Hub Team' // Override the writer's name
          },
          assignment: assignment,
          message: {
            subject: subject,
            body: body
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      toast.success("Email sent successfully to student");
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  // New function to update assignment progress
  const handleUpdateProgress = async () => {
    if (!assignment) return;
    
    try {
      setIsUpdatingProgress(true);
      
      // Update assignment progress in the database
      const { error } = await supabase
        .from('assignments')
        .update({
          progress: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Notify the student about the progress update
      const projectRef = "ihvgtaxvrqdnrgdddhdx";
      
      // Get writer details
      const { data: writerData, error: writerError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', assignment.writer_id)
        .single();
        
      if (writerError) {
        console.error('Error fetching writer data:', writerError);
      }
      
      // Send notification to student about progress update
      await fetch(`https://${projectRef}.supabase.co/functions/v1/notify-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'assignment_progress_update',
          assignment: {
            ...assignment,
            progress: progress
          },
          writer: writerData,
          progress: progress
        }),
      });
      
      toast.success(`Assignment progress updated to ${progress}%`);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error(`Failed to update progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Helper text to explain link functionality
  const helpText = (
    <div className="text-xs text-gray-500 mt-1">
      <p>You can include URLs in your message and they will be clickable in the email.</p>
      <p>Example: https://assignmenthub.org/dashboard</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {assignment?.student_email ? "Send Email to Student" : "Student Communication"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Update Section */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-sm font-medium mb-2">Update Assignment Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="progress" className="min-w-20">Progress: {progress}%</Label>
              <Slider
                id="progress"
                value={[progress]}
                onValueChange={(value) => setProgress(value[0])}
                min={0}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="flex items-center bg-gray-100 px-2 py-1 rounded text-sm">
                <Percent className="h-3 w-3 mr-1" /> {progress}
              </span>
            </div>
            <Button 
              onClick={handleUpdateProgress}
              disabled={isUpdatingProgress || !assignment}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isUpdatingProgress ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  Updating...
                </span>
              ) : (
                "Update Progress"
              )}
            </Button>
          </div>
        </div>

        {assignment?.student_email ? (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="recipient">To</Label>
              <Input 
                id="recipient" 
                value={assignment?.student_email || ''} 
                disabled 
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email will be sent to {assignment?.student_name || 'the student'} ({assignment?.student_email})
              </p>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea 
                id="body" 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="Enter your message"
                rows={12}
              />
              {helpText}
            </div>

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Your email will be sent with "Assignment Hub Team" as the sender name, not your personal name. Students can reply to this email to communicate with you.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-amber-600 bg-amber-50 rounded-md">
            <p>This student doesn't have an email address associated with their assignment submission.</p>
            <p className="text-sm mt-2">Only assignments submitted by students with accounts can receive emails.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Close
          </Button>
          {assignment?.student_email && (
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending || !assignment?.student_email}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WriterEmailModal;
