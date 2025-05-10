
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

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
    avatar_url: string | null;
  };
  recipient: {
    full_name: string | null;
    email: string;
    role: string;
    avatar_url: string | null;
  };
};

export const useMessages = (assignmentId?: string) => {
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, userRole, userId } = useAuth();

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
            sender:profiles!messages_sender_id_fkey(id, full_name, email, role, avatar_url),
            recipient:profiles!messages_recipient_id_fkey(id, full_name, email, role, avatar_url)
          `)
          .order('created_at', { ascending: false });

        if (assignmentId) {
          query = query.eq('assignment_id', assignmentId);
        }

        const { data, error: messagesError } = await query;

        if (messagesError) throw messagesError;
        
        // Properly cast the data to MessageWithProfile[] type
        if (data && Array.isArray(data)) {
          setMessages(data as unknown as MessageWithProfile[]);
        } else {
          setMessages([]);
        }

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
        () => {
          fetchMessages(); // Refetch all messages when there are changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [isAuthenticated, assignmentId]);

  const sendMessage = async (content: string, recipientId: string, assignmentId?: string) => {
    if (!userId) {
      toast.error("You must be logged in to send messages");
      return null;
    }
    
    try {
      const newMessage = {
        sender_id: userId,
        recipient_id: recipientId,
        content,
        assignment_id: assignmentId || null,
        read: false
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, role, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(id, full_name, email, role, avatar_url)
        `);

      if (error) throw error;
      
      toast.success("Message sent successfully");

      return data[0] as unknown as MessageWithProfile;
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error(err.message || "Failed to send message");
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
      
      // Update the local state to reflect the change
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      
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
