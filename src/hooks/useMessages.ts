
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  assignment_id?: string | null;
};

export type MessageWithProfile = Message & {
  sender: {
    full_name: string | null;
    email: string;
    role: string;
  };
  recipient: {
    full_name: string | null;
    email: string;
    role: string;
  };
};

export const useMessages = (assignmentId?: string) => {
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, full_name, email, role),
            recipient:profiles!messages_recipient_id_fkey(id, full_name, email, role)
          `)
          .order('created_at', { ascending: false });

        if (assignmentId) {
          query = query.eq('assignment_id', assignmentId);
        }

        const { data, error: messagesError } = await query;

        if (messagesError) throw messagesError;
        
        // Properly cast the data to MessageWithProfile[] type
        const typedMessages = data as unknown as MessageWithProfile[];
        setMessages(typedMessages || []);

      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError(err.message || 'Failed to fetch messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    
    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('messages-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        (payload) => {
          fetchMessages(); // Refetch all messages when there are changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [isAuthenticated, assignmentId]);

  const sendMessage = async (content: string, recipientId: string, assignmentId?: string) => {
    try {
      const newMessage = {
        content,
        recipient_id: recipientId,
        assignment_id: assignmentId
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage]) // sender_id is automatically added by RLS
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, role),
          recipient:profiles!messages_recipient_id_fkey(id, full_name, email, role)
        `);

      if (error) throw error;
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });

      return data[0] as unknown as MessageWithProfile;
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: err.message || "An error occurred while sending your message.",
      });
      throw err;
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
      
      return true;
    } catch (err: any) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead
  };
};
