
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
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, userRole, userId } = useAuth();

  const fetchMessages = async () => {
    if (!isAuthenticated || !userId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching messages for assignmentId:", assignmentId);
      console.log("Current user ID:", userId);

      // Use the raw client to bypass TypeScript issues
      const client = supabase as any;
      
      let query = client
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, email, role, avatar_url),
          recipient:profiles!recipient_id(id, full_name, email, role, avatar_url)
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
      
      // Properly cast the data to MessageWithProfile[] type
      if (data && Array.isArray(data)) {
        setMessages(data as unknown as MessageWithProfile[]);
        
        // Count unread messages addressed to current user
        const unread = data.filter(msg => 
          msg.recipient_id === userId && !msg.read
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
  };

  // Fetch unread count only (for notifications)
  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !userId) return;

    try {
      // Use the raw client to bypass TypeScript issues
      const client = supabase as any;
      
      const { count, error } = await client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('read', false);
        
      if (error) throw error;
      
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchMessages();
      
      // Set up real-time subscription for messages
      const channelId = assignmentId ? `messages-assignment-${assignmentId}` : `messages-user-${userId}`;
      
      const messagesSubscription = supabase
        .channel(channelId)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages' }, 
          (payload) => {
            console.log('Message change detected:', payload);
            fetchMessages(); // Refetch all messages when there are changes
            
            // Show notification for new message if recipient is current user
            const changeEvent = payload.eventType;
            const newMessage = payload.new as Message;
            
            if (changeEvent === 'INSERT' && newMessage && newMessage.recipient_id === userId && !newMessage.read) {
              // Get sender info
              supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', newMessage.sender_id)
                .single()
                .then(({ data }) => {
                  const senderName = data?.full_name || data?.email || 'Someone';
                  toast.message(`New message from ${senderName}`, {
                    description: newMessage.content.length > 50 
                      ? `${newMessage.content.substring(0, 50)}...` 
                      : newMessage.content,
                    action: {
                      label: "View",
                      onClick: () => {
                        // Navigate to assignment chat if there's an assignment_id
                        if (newMessage.assignment_id) {
                          window.location.href = `/assignment-chat/${newMessage.assignment_id}`;
                        } else {
                          window.location.href = '/messages';
                        }
                      }
                    }
                  });
                });
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [isAuthenticated, userId, assignmentId]);

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
      
      // Use the raw client to bypass TypeScript issues
      const client = supabase as any;
      
      const { data, error } = await client
        .from('messages')
        .insert(newMessage)
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, email, role, avatar_url),
          recipient:profiles!recipient_id(id, full_name, email, role, avatar_url)
        `);

      if (error) throw error;
      
      console.log("Message sent successfully:", data);
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
      // Use the raw client to bypass TypeScript issues
      const client = supabase as any;
      
      const { error } = await client
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
      
      // Update unread count
      fetchUnreadCount();
      
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
    unreadCount,
    sendMessage,
    markAsRead,
    fetchMessages,
    fetchUnreadCount
  };
};
