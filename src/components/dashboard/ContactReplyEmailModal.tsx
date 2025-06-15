
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { ContactMessage } from "./ContactMessagesModal";

interface ContactReplyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ContactMessage | null;
}

const ContactReplyEmailModal = ({ isOpen, onClose, message }: ContactReplyEmailModalProps) => {
  const [subject, setSubject] = useState<string>(() =>
    message ? `RE: ${message.subject}` : ""
  );
  const [body, setBody] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Reset form whenever opening or switching message
  React.useEffect(() => {
    if (isOpen && message) {
      setSubject(`RE: ${message.subject}`);
      setBody("");
    }
  }, [isOpen, message]);

  const handleSend = async () => {
    if (!message) return;
    if (!subject.trim() || !body.trim()) {
      toast.error("Please enter both a subject and message.");
      return;
    }
    setIsSending(true);
    try {
      // Hitting notify-message function for nicely styled email
      const response = await fetch("https://ihvgtaxvrqdnrgdddhdx.supabase.co/functions/v1/notify-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "writer_direct_email",
          recipient: {
            email: message.email,
            name: `${message.first_name} ${message.last_name}`,
          },
          sender: {
            full_name: "Assignment Hub Team", // Customize as needed
            email: "noreply@assignmenthub.org"
          },
          assignment: null, // Not an assignment, but API expects it, so send null
          message: { subject, body }
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email.");
      }
      toast.success("Reply sent to student!");
      onClose();
    } catch (error: any) {
      toast.error("Could not send: " + (error.message || "Unknown error"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Reply to Student
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" value={message?.email || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} rows={8} />
          </div>
          <div className="bg-blue-50 p-2 rounded border border-blue-100 text-xs text-blue-700">
            This email will be sent in a professionally formatted style.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSend} className="gap-2" disabled={isSending}>
            {isSending ? <>Sending...</> : <><Mail className="h-4 w-4" />Send</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactReplyEmailModal;
