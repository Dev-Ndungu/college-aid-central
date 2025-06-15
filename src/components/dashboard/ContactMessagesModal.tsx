import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import ContactReplyEmailModal from "./ContactReplyEmailModal";

type ContactMessage = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
  assigned_to: string | null;
};

type ContactMessagesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ContactMessagesModal = ({ isOpen, onClose }: ContactMessagesModalProps) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleSelectMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
  };

  const handleGoBack = () => {
    setSelectedMessage(null);
  };

  const handleReplyClick = (message: ContactMessage) => {
    setReplyMessage(message);
    setReplyModalOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> 
            Contact Messages
          </DialogTitle>
          <DialogDescription>
            Messages submitted through the contact form
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <p className="ml-2">Loading messages...</p>
          </div>
        ) : selectedMessage ? (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={handleGoBack} className="mb-4">
              &larr; Back to all messages
            </Button>
            
            <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span className="font-medium">From:</span> 
                  {selectedMessage.first_name} {selectedMessage.last_name} ({selectedMessage.email})
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(selectedMessage.created_at)}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              
              <div className="border-t pt-3 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleReplyClick(selectedMessage)}
                >
                  <Mail className="mr-1 h-4 w-4" /> Reply via Email
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        {message.first_name} {message.last_name}
                        <div className="text-xs text-gray-500">{message.email}</div>
                      </TableCell>
                      <TableCell>{message.subject}</TableCell>
                      <TableCell>{formatDate(message.created_at)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          message.status === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSelectMessage(message)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
        <ContactReplyEmailModal 
          isOpen={replyModalOpen}
          onClose={() => setReplyModalOpen(false)}
          message={replyMessage}
        />
      </DialogContent>
    </Dialog>
  );
};

export type { ContactMessage };
export default ContactMessagesModal;
