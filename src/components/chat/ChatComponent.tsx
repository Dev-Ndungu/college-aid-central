
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
import { toast } from "sonner";

interface ChatComponentProps {
  recipientId: string;
  assignmentId?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ recipientId, assignmentId }) => {
  const [newMessage, setNewMessage] = useState('');
  const { messages, isLoading, sendMessage, markAsRead, fetchMessages, markAllAsRead } = useMessages(assignmentId);
  const [isSending, setIsSending] = useState(false);
  const { userEmail, userId } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      console.log(`Sending message to recipient ${recipientId}${assignmentId ? ` for assignment ${assignmentId}` : ''}`);
      
      const result = await sendMessage(newMessage, recipientId, assignmentId);
      if (result) {
        setNewMessage('');
        console.log('Message sent successfully:', result);
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Mark messages as read when they are viewed
  useEffect(() => {
    if (filteredMessages.length > 0 && userId) {
      const unreadMessages = filteredMessages.filter(
        msg => msg.recipient_id === userId && !msg.read
      );
      
      if (unreadMessages.length > 0) {
        console.log("Marking messages as read:", unreadMessages.length);
        // Mark all unread messages from this sender as read
        markAllAsRead(recipientId);
      }
    }
  }, [filteredMessages, userId, recipientId, markAllAsRead]);

  // Fetch messages on component mount and when dependencies change
  useEffect(() => {
    console.log("Fetching messages for recipient:", recipientId);
    fetchMessages();
  }, [recipientId, assignmentId, fetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages]);

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
              <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium">No messages yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-1">
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
      
      <Card className="border-t rounded-t-none rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2 p-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="resize-none flex-grow min-h-[80px] max-h-[120px]"
          />
          <div className="flex flex-col justify-between">
            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10"
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
            <AvatarFallback className={isCurrentUserMessage ? 'bg-brand-100 text-brand-800' : 'bg-muted'}>
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
            <p className="text-xs text-gray-500 mb-1 px-1">
              {message.sender.full_name || message.sender.email}
            </p>
          )}
          <div className={`
            px-4 py-3 rounded-2xl shadow-sm 
            ${isCurrentUserMessage 
              ? 'bg-brand-100 text-brand-900 rounded-tr-none' 
              : 'bg-white border rounded-tl-none'}
          `}>
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
          </div>
          <p className={`text-xs text-gray-500 mt-1 ${isCurrentUserMessage ? 'text-right' : 'text-left'}`}>
            {messageTime}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
