
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader, Send } from "lucide-react";
import { useMessages, type MessageWithProfile } from "@/hooks/useMessages";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ChatComponentProps {
  recipientId: string;
  assignmentId?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ recipientId, assignmentId }) => {
  const [newMessage, setNewMessage] = useState('');
  const { messages, isLoading, sendMessage } = useMessages(assignmentId);
  const [isSending, setIsSending] = useState(false);
  const { userEmail } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages to only show those between the current user and the recipient
  const filteredMessages = messages.filter(message => 
    (message.sender_id === recipientId || message.recipient_id === recipientId)
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      await sendMessage(newMessage, recipientId, assignmentId);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          filteredMessages.map((message) => (
            <MessageBubble key={message.id} message={message} currentUserEmail={userEmail} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
          className="resize-none flex-grow"
          rows={3}
        />
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
      </form>
    </div>
  );
};

interface MessageBubbleProps {
  message: MessageWithProfile;
  currentUserEmail: string | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserEmail }) => {
  const isCurrentUserMessage = message.sender.email === currentUserEmail;
  
  return (
    <div className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[75%] ${isCurrentUserMessage ? 'flex-row-reverse' : ''}`}>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {message.sender.full_name 
              ? message.sender.full_name.charAt(0).toUpperCase() 
              : message.sender.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <Card className={`
            ${isCurrentUserMessage ? 'bg-brand-100 border-brand-200' : ''}
          `}>
            <CardContent className="p-3">
              <p className="text-sm font-medium">
                {message.sender.full_name || message.sender.email}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(message.created_at), 'MMM d, h:mm a')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
