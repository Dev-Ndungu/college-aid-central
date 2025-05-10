
import { useState, useEffect, useCallback } from 'react';
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
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, userRole, userId } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated || !userId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching messages for assignmentId:", assignmentId);
      console.log("Current user ID:", userId);

      // Improved query with explicit join format
      let query = supabase
        .from('messages')
        .select(`
          id, 
          sender_id,
          recipient_id,
          content,
          created_at,
          read,
          assignment_id,
          sender:profiles!messages_sender_id_fkey (id, full_name, email, role, avatar_url),
          recipient:profiles!messages_recipient_id_fkey (id, full_name, email, role, avatar_url)
        `);

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      } else {
        // If no assignment ID, just get messages involving this user
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      }

      query = query.order('created_at', { ascending: true });

      const { data, error: messagesError } = await query;

      if (messagesError) {
        console.error('Error in query:', messagesError);
        throw messagesError;
      }
      
      console.log("Messages data:", data);
      
      if (data && Array.isArray(data)) {
        // Transform the data to match our expected format
        const transformedMessages = data.map(msg => ({
          ...msg,
          sender: msg.sender || { id: msg.sender_id, full_name: null, email: '', role: '', avatar_url: null },
          recipient: msg.recipient || { id: msg.recipient_id, full_name: null, email: '', role: '', avatar_url: null }
        }));
        
        setMessages(transformedMessages as MessageWithProfile[]);
        
        // Count unread messages
        const unread = transformedMessages.filter(
          msg => msg.recipient_id === userId && !msg.read
        ).length;
        
        setUnreadCount(unread);
      } else {
        setMessages([]);
        setUnreadCount(0);
      }

    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, assignmentId]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchMessages();
      
      // Set up real-time subscription for messages
      const channelName = assignmentId 
        ? `messages-assignment-${assignmentId}` 
        : `messages-user-${userId}`;
      
      console.log(`Setting up realtime subscription for channel: ${channelName}`);
      
      const messagesSubscription = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: assignmentId 
              ? `assignment_id=eq.${assignmentId}`
              : `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
          }, 
          (payload) => {
            console.log('Message change detected:', payload);
            fetchMessages(); // Refetch all messages when there are changes
          }
        )
        .subscribe((status) => {
          console.log(`Realtime subscription status for ${channelName}:`, status);
        });

      return () => {
        console.log(`Removing channel: ${channelName}`);
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [isAuthenticated, userId, assignmentId, fetchMessages]);

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
      
      console.log("Sending message:", newMessage);
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select(`
          id, 
          sender_id,
          recipient_id,
          content,
          created_at,
          read,
          assignment_id,
          sender:profiles!messages_sender_id_fkey (id, full_name, email, role, avatar_url),
          recipient:profiles!messages_recipient_id_fkey (id, full_name, email, role, avatar_url)
        `);

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log("Message sent successfully:", data);
      toast.success("Message sent successfully");

      // Force a refresh of messages
      fetchMessages();

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
      
      console.log(`Marked message ${messageId} as read`);
      
      // Update the local state to reflect the change
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err: any) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  };

  // Mark all messages from a specific user or assignment as read
  const markAllAsRead = async (senderId?: string) => {
    if (!userId) return;
    
    try {
      let query = supabase
        .from('messages')
        .update({ read: true })
        .eq('recipient_id', userId)
        .eq('read', false);
        
      if (senderId) {
        query = query.eq('sender_id', senderId);
      }
      
      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }
      
      const { error, count } = await query;
      
      if (error) throw error;
      
      console.log(`Marked ${count} messages as read`);
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          (msg.recipient_id === userId && (!senderId || msg.sender_id === senderId))
            ? { ...msg, read: true } 
            : msg
        )
      );
      
      // Reset unread count if we marked all as read
      if (!senderId && !assignmentId) {
        setUnreadCount(0);
      } else {
        // Recalculate unread count
        const unread = messages.filter(
          msg => msg.recipient_id === userId && !msg.read && 
            (senderId ? msg.sender_id !== senderId : true) &&
            (assignmentId ? msg.assignment_id !== assignmentId : true)
        ).length;
        
        setUnreadCount(unread);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
      return false;
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    fetchMessages,
    markAllAsRead,
    unreadCount
  };
};
