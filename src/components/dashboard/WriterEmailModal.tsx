
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
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
  const [isSending, setIsSending] = useState<boolean>(false);

  // Reset form when assignment changes or modal opens
  React.useEffect(() => {
    if (isOpen && assignment) {
      // Create a more detailed email subject
      setSubject(`Update on your assignment: ${assignment.title}`);
      
      // Format assignment details for the email body
      const dueDate = assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Not specified';
      const progress = assignment.progress ? `${assignment.progress}%` : 'Not started';
      
      // Create a more detailed email template with assignment details
      const emailBody = `Hello ${assignment.student_name || ''},

I wanted to provide you with an update regarding your assignment "${assignment.title}".

Assignment Details:
- Title: ${assignment.title}
- Subject: ${assignment.subject}
- Due Date: ${dueDate}
- Current Status: ${assignment.status.replace('_', ' ')}
- Progress: ${progress}
${assignment.description ? `- Description: ${assignment.description}` : ''}

[Your message to the student here]

You can check your assignment status here: https://assignmenthub.org/dashboard

Best regards,
The Assignment Hub Team`;

      setBody(emailBody);
    }
  }, [assignment, isOpen]);

  const handleSendEmail = async () => {
    if (!assignment) {
      toast.error("Cannot send email - assignment details are missing");
      return;
    }
    
    // Determine the correct email to use
    const studentEmail = assignment.student_email;
    
    if (!studentEmail) {
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
            email: studentEmail,
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
        const errorText = await response.text();
        console.error('Email API error response:', errorText);
        
        // Try to parse the error as JSON if possible
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to send email');
        } catch (parseError) {
          // If we can't parse as JSON, just use the text
          throw new Error(`Failed to send email: ${errorText}`);
        }
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
            Send Email to Student
          </DialogTitle>
        </DialogHeader>

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
            
            <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
              <p className="text-xs text-amber-700">
                <strong>Important:</strong> During development mode, all emails will be redirected to the developer's email address. In production, these will go directly to students.
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
            Cancel
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WriterEmailModal;
