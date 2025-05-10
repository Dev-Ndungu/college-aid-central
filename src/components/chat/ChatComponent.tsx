
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader, Send, MessageCircle } from "lucide-react";
import { useMessages, type MessageWithProfile } from "@/hooks/useMessages";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ChatComponentProps {
  recipientId: string;
  assignmentId?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ recipientId, assignmentId }) => {
  const [newMessage, setNewMessage] = useState('');
  const { messages, isLoading, sendMessage, markAsRead, fetchMessages } = useMessages(assignmentId);
  const [isSending, setIsSending] = useState(false);
  const { userEmail, userId, userRole } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);

  // Filter messages to only show those between the current user and the recipient
  // When assignmentId is provided, it will automatically filter by assignment thanks to useMessages hook
  const filteredMessages = assignmentId 
    ? messages 
    : messages.filter(message => 
        (message.sender_id === recipientId || message.recipient_id === recipientId)
      );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      await sendMessage(newMessage, recipientId, assignmentId);
      setNewMessage('');
      // Force refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Mark messages as read when they are viewed
  useEffect(() => {
    const unreadMessages = filteredMessages.filter(
      msg => msg.recipient_id === userId && !msg.read
    );
    
    if (unreadMessages.length > 0) {
      console.log("Marking messages as read:", unreadMessages.length);
      unreadMessages.forEach(msg => {
        markAsRead(msg.id);
      });
    }
  }, [filteredMessages, userId, markAsRead]);

  // Check for new messages and show notifications
  useEffect(() => {
    // Skip on the initial load
    if (initialLoadRef.current) {
      // Set the last message time for future reference
      if (filteredMessages.length > 0) {
        lastMessageTimeRef.current = filteredMessages[filteredMessages.length - 1].created_at;
      }
      initialLoadRef.current = false;
      return;
    }

    // Find new messages that the user has received
    const newMessages = filteredMessages.filter(msg => 
      msg.recipient_id === userId && 
      (!lastMessageTimeRef.current || new Date(msg.created_at) > new Date(lastMessageTimeRef.current))
    );

    // Show notification for new messages
    if (newMessages.length > 0) {
      const lastMessage = newMessages[newMessages.length - 1];
      
      // Update the last message time
      lastMessageTimeRef.current = lastMessage.created_at;
      
      // Show notification if the message is from the other person
      if (lastMessage.sender_id !== userId) {
        const senderName = lastMessage.sender.full_name || lastMessage.sender.email || 'Someone';
        toast.success(`New message from ${senderName}`, {
          description: lastMessage.content.length > 50 
            ? `${lastMessage.content.substring(0, 50)}...` 
            : lastMessage.content
        });
      }
    }
  }, [filteredMessages, userId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow mb-4 pb-2 pr-4">
        <div className="space-y-4 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 dark:bg-gray-800">
                <MessageCircle className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No messages yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                Start the conversation by sending a message!
              </p>
            </div>
          ) : (
            <>
              {filteredMessages.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  currentUserEmail={userEmail}
                  showAvatar={
                    index === 0 || 
                    filteredMessages[index - 1]?.sender_id !== message.sender_id
                  } 
                />
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <Card className="border-t rounded-t-none rounded-b-lg bg-background/50 backdrop-blur-sm border-purple-800/20">
        <form onSubmit={handleSendMessage} className="flex gap-2 p-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="resize-none flex-grow min-h-[80px] max-h-[120px] bg-background/70 border-purple-800/30"
          />
          <div className="flex flex-col justify-between">
            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10 bg-gradient-to-br from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900"
              disabled={isSending || !newMessage.trim()}
            >
              {isSending ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

interface MessageBubbleProps {
  message: MessageWithProfile;
  currentUserEmail: string | null;
  showAvatar: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  currentUserEmail,
  showAvatar
}) => {
  const isCurrentUserMessage = message.sender.email === currentUserEmail;
  const messageTime = format(new Date(message.created_at), 'MMM d, h:mm a');
  
  return (
    <div className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[80%] ${isCurrentUserMessage ? 'flex-row-reverse' : ''}`}>
        {showAvatar ? (
          <Avatar className="h-8 w-8 mt-1">
            <AvatarFallback className={isCurrentUserMessage 
              ? 'bg-indigo-900/20 text-indigo-200' 
              : 'bg-purple-900/20 text-purple-200'}>
              {message.sender.full_name 
                ? message.sender.full_name.charAt(0).toUpperCase() 
                : message.sender.email.charAt(0).toUpperCase()}
            </AvatarFallback>
            {message.sender.avatar_url && (
              <AvatarImage src={message.sender.avatar_url} alt={message.sender.full_name || 'User'} />
            )}
          </Avatar>
        ) : (
          <div className="w-8" /> 
        )}
        
        <div>
          {showAvatar && (
            <p className="text-xs text-gray-400 mb-1 px-1">
              {message.sender.full_name || message.sender.email}
            </p>
          )}
          <div className={`
            px-4 py-3 rounded-2xl shadow-sm 
            ${isCurrentUserMessage 
              ? 'bg-gradient-to-br from-indigo-900/70 to-purple-900/80 text-white/90 rounded-tr-none backdrop-blur-sm border border-indigo-700/30' 
              : 'bg-white/10 border border-white/20 text-white/90 rounded-tl-none backdrop-blur-sm'}
          `}>
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
          </div>
          <p className={`text-xs text-gray-400 mt-1 ${isCurrentUserMessage ? 'text-right' : 'text-left'}`}>
            {messageTime}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
