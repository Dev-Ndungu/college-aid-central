
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
import { Send, User, Loader, MessageCircle, Bell } from 'lucide-react';
import { Writer } from '@/hooks/useWriters';
import { useMessages } from '@/hooks/useMessages';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Messages = () => {
  const { isAuthenticated, isLoading: authLoading, userId, userEmail } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeUserName, setActiveUserName] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessageEmail, setNewMessageEmail] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const { 
    messages, 
    isLoading: messagesLoading, 
    sendMessage, 
    markAllAsRead, 
    fetchMessages 
  } = useMessages();

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

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
            sender:profiles!messages_sender_id_fkey(id, full_name, email),
            recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
          `)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;

        // Process messages into conversations
        const conversationsMap = new Map<string, any>();
        
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
        { event: '*', schema: 'public', table: 'messages' }, 
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [userId]);

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
      await sendMessage(newMessageContent.trim(), userData.id);
      
      toast.success('Message sent successfully');
      setShowNewMessageForm(false);
      setNewMessageEmail('');
      setNewMessageContent('');
      
      // Set this as the active conversation
      setActiveConversation(userData.id);
      setActiveUserName(userData.full_name || userData.email);
      
      // Force refresh conversations
      const { data: freshConversations } = await supabase
        .from('messages')
        .select(`
          id, 
          content, 
          created_at, 
          read,
          sender_id, 
          recipient_id,
          sender:profiles!messages_sender_id_fkey(id, full_name, email),
          recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });
        
      if (freshConversations && Array.isArray(freshConversations)) {
        // Process into conversations
        const conversationsMap = new Map<string, any>();
        freshConversations.forEach(message => {
          const isUserSender = message.sender_id === userId;
          const otherUserId = isUserSender ? message.recipient_id : message.sender_id;
          const otherUserData = isUserSender ? message.recipient : message.sender;
          
          if (!otherUserId || !otherUserData) return;
          
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
            const conversation = conversationsMap.get(otherUserId)!;
            conversation.unreadCount += 1;
          }
        });
        
        // Convert to array and sort
        const conversationsArray = Array.from(conversationsMap.values())
          .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
        
        setConversations(conversationsArray);
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
    
    // Mark all messages from this user as read
    markAllAsRead(userId);
    
    // Update conversations to reflect read messages
    setConversations(prev => 
      prev.map(conv => 
        conv.userId === userId 
          ? { ...conv, unreadCount: 0 } 
          : conv
      )
    );
  };
  
  // Handle sending message in active conversation
  const handleSendMessage = async (content: string) => {
    if (!activeConversation || !content.trim()) return;
    
    try {
      await sendMessage(content, activeConversation);
      
      // Force refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
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

  // Filter messages for active conversation
  const activeMessages = messages.filter(message => 
    message.sender_id === activeConversation || message.recipient_id === activeConversation
  );

  // Count total unread messages
  const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (authLoading) {
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
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-gray-600">Communicate with students and writers</p>
            </div>
            
            {totalUnreadMessages > 0 && (
              <Badge variant="destructive" className="text-sm">
                {totalUnreadMessages} unread message{totalUnreadMessages > 1 ? 's' : ''}
              </Badge>
            )}
          </header>

          <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                      <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
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
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{getInitials(conversation.userName)}</AvatarFallback>
                            </Avatar>
                            {conversation.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                              <p className={`font-medium ${conversation.unreadCount > 0 ? 'font-bold' : ''}`}>
                                {conversation.userName || conversation.userEmail}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatMessageDate(conversation.lastMessageDate)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className={`text-sm truncate max-w-[180px] ${
                                conversation.unreadCount > 0 
                                  ? 'font-semibold text-gray-900' 
                                  : 'text-gray-600'
                              }`}>
                                {conversation.lastMessage}
                              </p>
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
                      {messagesLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <Loader className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      ) : activeMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p>No messages yet</p>
                          <p className="text-sm">Send a message to start the conversation</p>
                        </div>
                      ) : (
                        activeMessages.map(message => {
                          const isCurrentUser = message.sender_id === userId;
                          return (
                            <div 
                              key={message.id}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isCurrentUser 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const input = form.elements.namedItem('messageInput') as HTMLInputElement;
                          if (input.value.trim()) {
                            handleSendMessage(input.value);
                            input.value = '';
                          }
                        }}
                        className="flex"
                      >
                        <Input 
                          name="messageInput"
                          placeholder="Type a message..." 
                          className="mr-2"
                        />
                        <Button type="submit">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-1">No conversation selected</h3>
                      <p>Choose a conversation from the sidebar or start a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
