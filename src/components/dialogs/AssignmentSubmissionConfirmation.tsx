
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail, Phone } from "lucide-react";

interface AssignmentSubmissionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssignmentSubmissionConfirmation = ({ open, onOpenChange }: AssignmentSubmissionConfirmationProps) => {
  const whatsappNumber = "+12368801220"; // Updated to match edge function
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const emailAddress = "write.mefoundation@gmail.com"; // Updated to match edge function

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Assignment Submitted Successfully!</DialogTitle>
          <DialogDescription className="pt-4 text-base">
            Thank you for submitting your assignment. One of our writers will get in touch with you shortly via email or WhatsApp to discuss your requirements in detail.
            
            {/* Added message about email confirmation */}
            <p className="mt-3 font-medium">
              A confirmation email has been sent to your email address. Please check your inbox (and spam folder).
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-2">
          <p className="font-medium text-center">Need immediate assistance?</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2" onClick={() => window.open(whatsappUrl, '_blank')}>
              <Phone className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.open(`mailto:${emailAddress}`, '_blank')}>
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            className="w-full bg-[#0d2241] hover:bg-[#193764]" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentSubmissionConfirmation;
