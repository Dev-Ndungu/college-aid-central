
import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SendHorizontal } from "lucide-react";

interface StudentEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string | null;
  studentEmail: string | null;
  assignmentTitle: string;
  assignmentId: string;
  writerId: string;
}

const StudentEmailModal = ({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  assignmentTitle,
  assignmentId,
  writerId
}: StudentEmailModalProps) => {
  const [subject, setSubject] = useState(`Update regarding your assignment: ${assignmentTitle}`);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!studentEmail) {
      toast.error("No student email address available");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please provide an email subject");
      return;
    }

    if (!message.trim()) {
      toast.error("Please write a message to send");
      return;
    }

    setIsSending(true);

    try {
      // Get writer details to include in the email
      const { data: writerData, error: writerError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', writerId)
        .single();
        
      if (writerError) {
        console.error('Error fetching writer details:', writerError);
        throw writerError;
      }

      // Use the full HTTPS URL for the function call to prevent routing issues
      const projectRef = "ihvgtaxvrqdnrgdddhdx";
      
      // Using fetch with complete HTTPS URL and all required headers
      const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/notify-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          type: 'writer_direct_email',
          student_email: studentEmail,
          student_name: studentName || 'Student',
          subject: subject,
          message: message,
          assignment_id: assignmentId,
          writer: writerData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from API:', errorText);
        throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
      }
      
      // Parse the response
      const responseData = await response.json();
      console.log('Email API response:', responseData);

      toast.success("Email sent successfully!");
      
      // Log the email communication in the messages table
      await supabase.from('messages').insert({
        sender_id: writerId,
        recipient_id: null, // Can be null for direct emails where we don't have recipient ID
        assignment_id: assignmentId,
        content: `[Email Sent] Subject: ${subject}\n\n${message}`,
        is_email: true,
        email_recipient: studentEmail
      });
      
      // Reset form and close modal
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Email to {studentName || studentEmail || 'Student'}</DialogTitle>
          <DialogDescription>
            Send a direct email to the student regarding their assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={studentEmail || 'No email available'}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className="min-h-[150px]"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Sending...
              </>
            ) : (
              <>
                <SendHorizontal className="mr-2 h-4 w-4" /> Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEmailModal;
