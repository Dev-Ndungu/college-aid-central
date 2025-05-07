
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Send, User, Loader } from 'lucide-react';
import { Writer } from '@/hooks/useWriters';

// Define message type
type Message = {
  id: string;
  sender_id: string;
  recipient_id: string; // Changed from receiver_id to recipient_id
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name: string | null;
    email: string;
  };
  recipient?: { // Changed from receiver to recipient
    full_name: string | null;
    email: string;
  };
};

// Define conversation type
type Conversation = {
  userId: string;
  userName: string | null;
  userEmail: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
};

const Messages = () => {
  const { isAuthenticated, isLoading, userId, userEmail } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeUserName, setActiveUserName] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [writer, setWriter] = useState<Writer | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessageEmail, setNewMessageEmail] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;
      
      setLoadingConversations(true);
      try {
        // Get all messages where the user is either sender or receiver
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id, 
            content, 
            created_at, 
            read,
            sender_id, 
            recipient_id,
            sender:profiles!messages_sender_id_fkey(full_name, email),
            recipient:profiles!messages_recipient_id_fkey(full_name, email)
          `)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;

        // Process messages into conversations
        const conversationsMap = new Map<string, Conversation>();
        
        if (messagesData && Array.isArray(messagesData)) {
          messagesData.forEach(message => {
            // Determine if the other user is the sender or receiver
            const isUserSender = message.sender_id === userId;
            const otherUserId = isUserSender ? message.recipient_id : message.sender_id;
            const otherUserData = isUserSender ? message.recipient : message.sender;
            
            if (!otherUserId || !otherUserData) return;
            
            // Get or create conversation
            if (!conversationsMap.has(otherUserId)) {
              conversationsMap.set(otherUserId, {
                userId: otherUserId,
                userName: otherUserData.full_name,
                userEmail: otherUserData.email,
                lastMessage: message.content,
                lastMessageDate: message.created_at,
                unreadCount: (!isUserSender && !message.read) ? 1 : 0
              });
            } else if (!isUserSender && !message.read) {
              // Increment unread count if this is an unread message to the user
              const conversation = conversationsMap.get(otherUserId)!;
              conversation.unreadCount += 1;
            }
          });
        }
        
        // Convert map to array and sort by last message date
        const conversationsArray = Array.from(conversationsMap.values())
          .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
        
        setConversations(conversationsArray);
      } catch (error: any) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
    
    // Set up real-time subscription for new messages
    const messagesSubscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, 
        () => fetchConversations()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, 
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [userId]);

  // Fetch messages for active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !activeConversation) return;
      
      setLoadingMessages(true);
      try {
        // Get messages between the user and the active conversation user
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id, 
            content, 
            created_at, 
            read,
            sender_id, 
            recipient_id,
            sender:profiles!messages_sender_id_fkey(full_name, email),
            recipient:profiles!messages_recipient_id_fkey(full_name, email)
          `)
          .or(`and(sender_id.eq.${userId},recipient_id.eq.${activeConversation}),and(sender_id.eq.${activeConversation},recipient_id.eq.${userId})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          setMessages(data as Message[]);
          
          // Mark messages as read
          const unreadMessageIds = data
            .filter(msg => msg.recipient_id === userId && !msg.read)
            .map(msg => msg.id);
            
          if (unreadMessageIds && unreadMessageIds.length > 0) {
            await supabase
              .from('messages')
              .update({ read: true })
              .in('id', unreadMessageIds);
              
            // Update conversations to reflect read messages
            setConversations(prev => 
              prev.map(conv => 
                conv.userId === activeConversation 
                  ? { ...conv, unreadCount: 0 } 
                  : conv
              )
            );
          }
        } else {
          setMessages([]);
        }
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    
    // Set up real-time subscription for messages in this conversation
    const conversationSubscription = supabase
      .channel(`conversation-${activeConversation}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${activeConversation}` }, 
        () => fetchMessages()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${activeConversation}` }, 
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationSubscription);
    };
  }, [userId, activeConversation]);

  // Handle sending a message
  const sendMessage = async () => {
    if (!userId || !activeConversation || !newMessage.trim()) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          recipient_id: activeConversation,
          content: newMessage.trim(),
          read: false
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Handle starting a new conversation
  const startNewConversation = async () => {
    if (!userId || !newMessageEmail || !newMessageContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setSendingMessage(true);
    try {
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', newMessageEmail)
        .single();

      if (userError) {
        toast.error('User not found with that email');
        return;
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          recipient_id: userData.id,
          content: newMessageContent.trim(),
          read: false
        });

      if (messageError) throw messageError;
      
      toast.success('Message sent successfully');
      setShowNewMessageForm(false);
      setNewMessageEmail('');
      setNewMessageContent('');
      
      // Set this as the active conversation
      setActiveConversation(userData.id);
      setActiveUserName(userData.full_name || userData.email);
      
      // Add to conversations if not already there
      const existingConversation = conversations.find(c => c.userId === userData.id);
      if (!existingConversation) {
        setConversations(prev => [{
          userId: userData.id,
          userName: userData.full_name,
          userEmail: userData.email,
          lastMessage: newMessageContent.trim(),
          lastMessageDate: new Date().toISOString(),
          unreadCount: 0
        }, ...prev]);
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle selecting a conversation
  const selectConversation = (userId: string, userName: string | null) => {
    setActiveConversation(userId);
    setActiveUserName(userName);
    setShowNewMessageForm(false);
  };

  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-gray-600">Communicate with students and writers</p>
          </header>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex h-[600px]">
              {/* Conversations sidebar */}
              <div className="w-1/3 border-r">
                <div className="p-4 border-b">
                  <Button 
                    onClick={() => {
                      setShowNewMessageForm(true);
                      setActiveConversation(null);
                    }}
                    className="w-full"
                  >
                    New Message
                  </Button>
                </div>
                
                <div className="overflow-y-auto h-[calc(600px-73px)]">
                  {loadingConversations ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>No conversations yet</p>
                      <p className="text-sm mt-1">Start a new message to begin chatting</p>
                    </div>
                  ) : (
                    conversations.map(conversation => (
                      <div 
                        key={conversation.userId}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                          activeConversation === conversation.userId ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => selectConversation(conversation.userId, conversation.userName)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(conversation.userName)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                              <p className="font-medium">
                                {conversation.userName || conversation.userEmail}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatMessageDate(conversation.lastMessageDate)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600 truncate max-w-[180px]">
                                {conversation.lastMessage}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Message content area */}
              <div className="w-2/3 flex flex-col">
                {showNewMessageForm ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <h2 className="text-lg font-medium">New Message</h2>
                    </div>
                    <div className="p-4 flex-grow">
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">To:</label>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          value={newMessageEmail}
                          onChange={(e) => setNewMessageEmail(e.target.value)}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Message:</label>
                        <Textarea 
                          placeholder="Type your message here..." 
                          className="min-h-[200px]"
                          value={newMessageContent}
                          onChange={(e) => setNewMessageContent(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          className="mr-2"
                          onClick={() => setShowNewMessageForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={startNewConversation}
                          disabled={sendingMessage || !newMessageEmail || !newMessageContent.trim()}
                        >
                          {sendingMessage ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : activeConversation ? (
                  <>
                    <div className="p-4 border-b">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{getInitials(activeUserName)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-medium">{activeUserName || 'User'}</h2>
                      </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                      {loadingMessages ? (
                        <div className="flex justify-center items-center h-32">
                          <Loader className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>No messages yet</p>
                          <p className="text-sm">Send a message to start the conversation</p>
                        </div>
                      ) : (
                        messages.map(message => {
                          const isCurrentUser = message.sender_id === userId;
                          return (
                            <div 
                              key={message.id}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isCurrentUser 
                                    ? 'bg-primary text-white' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                <p>{message.content}</p>
                                <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-50' : 'text-gray-500'}`}>
                                  {formatMessageDate(message.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="p-4 border-t">
                      <div className="flex">
                        <Input 
                          placeholder="Type a message..." 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          className="mr-2"
                        />
                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-1">No conversation selected</h3>
                      <p>Choose a conversation from the sidebar or start a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
