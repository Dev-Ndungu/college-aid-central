
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useWriters, Writer } from '@/hooks/useWriters';
import ChatComponent from '@/components/chat/ChatComponent';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader, MessageSquare, Search, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMessages } from '@/hooks/useMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

const Messages = () => {
  const { isAuthenticated, isLoading: authLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const { writers, isLoading: writersLoading } = useWriters();
  const [selectedWriter, setSelectedWriter] = useState<Writer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { messages } = useMessages();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const filteredWriters = searchQuery 
    ? writers.filter(writer => 
        (writer.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (writer.email.toLowerCase()).includes(searchQuery.toLowerCase())
      )
    : writers;

  // Find unique conversation partners for the writer view
  const uniqueConversations = React.useMemo(() => {
    if (userRole !== 'writer') return [];

    const conversationMap = new Map();
    
    messages.forEach(msg => {
      // Get the ID of the other participant (student)
      const otherParticipantId = msg.sender_id === msg.recipient_id 
        ? msg.sender_id // For self-messages
        : (msg.recipient_id);
      
      // If this is a message to/from a student
      if (otherParticipantId) {
        if (!conversationMap.has(otherParticipantId)) {
          conversationMap.set(otherParticipantId, {
            id: otherParticipantId,
            full_name: msg.sender_id === otherParticipantId 
              ? msg.sender.full_name 
              : msg.recipient.full_name,
            email: msg.sender_id === otherParticipantId 
              ? msg.sender.email 
              : msg.recipient.email,
            avatar_url: msg.sender_id === otherParticipantId 
              ? msg.sender.avatar_url 
              : msg.recipient.avatar_url,
            lastMessage: msg.content,
            timestamp: msg.created_at,
            unread: !msg.read && msg.recipient_id === otherParticipantId
          });
        } else {
          // Update if this message is newer
          const existing = conversationMap.get(otherParticipantId);
          if (new Date(msg.created_at) > new Date(existing.timestamp)) {
            existing.lastMessage = msg.content;
            existing.timestamp = msg.created_at;
            existing.unread = !msg.read && msg.recipient_id === otherParticipantId;
            conversationMap.set(otherParticipantId, existing);
          }
        }
      }
    });
    
    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, userRole]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-gray-600">
              {userRole === 'student' 
                ? 'Chat with our writers for help with your assignments' 
                : 'Chat with students about their assignments'}
            </p>
          </header>

          <div className="grid md:grid-cols-12 gap-6 min-h-[600px]">
            {/* Left sidebar */}
            <div className={`md:col-span-${selectedWriter && userRole === 'student' ? '4' : '12 md:col-span-4'}`}>
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {userRole === 'student' ? 'Writers' : 'Students'}
                    </CardTitle>
                    {selectedWriter && userRole === 'student' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedWriter(null)}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${userRole === 'student' ? 'writers' : 'students'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <ScrollArea className="flex-grow overflow-auto">
                  <CardContent className="p-0">
                    {userRole === 'student' ? (
                      writersLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader className="h-6 w-6 animate-spin" />
                        </div>
                      ) : filteredWriters.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          {searchQuery 
                            ? 'No writers match your search' 
                            : 'No writers available at the moment'}
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredWriters.map((writer) => (
                            <Button
                              key={writer.id}
                              variant="ghost"
                              className={`w-full justify-start rounded-none py-4 px-4 h-auto ${
                                selectedWriter?.id === writer.id ? 'bg-gray-100' : ''
                              }`}
                              onClick={() => setSelectedWriter(writer)}
                            >
                              <div className="flex items-center w-full">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback>
                                    {writer.full_name 
                                      ? writer.full_name.charAt(0).toUpperCase() 
                                      : writer.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                  {writer.avatar_url && (
                                    <AvatarImage src={writer.avatar_url} alt={writer.full_name || 'Writer'} />
                                  )}
                                </Avatar>
                                <div className="text-left">
                                  <p className="font-medium text-foreground">
                                    {writer.full_name || 'Writer'}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {writer.email}
                                  </p>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )
                    ) : (
                      // Writer view shows all unique conversations
                      uniqueConversations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          No active conversations
                        </div>
                      ) : (
                        <div className="divide-y">
                          {uniqueConversations.map((convo) => (
                            <Button
                              key={convo.id}
                              variant="ghost"
                              className={`w-full justify-start rounded-none py-3 px-4 h-auto ${
                                selectedWriter?.id === convo.id ? 'bg-gray-100' : ''
                              }`}
                              onClick={() => setSelectedWriter({
                                id: convo.id,
                                full_name: convo.full_name || null,
                                email: convo.email,
                                avatar_url: convo.avatar_url
                              })}
                            >
                              <div className="flex items-center w-full">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback>
                                    {convo.full_name 
                                      ? convo.full_name.charAt(0).toUpperCase() 
                                      : convo.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                  {convo.avatar_url && (
                                    <AvatarImage src={convo.avatar_url} alt={convo.full_name || 'Student'} />
                                  )}
                                </Avatar>
                                <div className="text-left flex-1 overflow-hidden">
                                  <div className="flex justify-between">
                                    <p className={`font-medium ${convo.unread ? 'text-brand-700' : 'text-foreground'}`}>
                                      {convo.full_name || convo.email}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {format(new Date(convo.timestamp), 'h:mm a')}
                                    </p>
                                  </div>
                                  <p className={`text-xs truncate ${convo.unread ? 'text-brand-600 font-medium' : 'text-gray-500'}`}>
                                    {convo.lastMessage}
                                  </p>
                                </div>
                                {convo.unread && (
                                  <div className="h-2 w-2 bg-brand-500 rounded-full ml-2"></div>
                                )}
                              </div>
                            </Button>
                          ))}
                        </div>
                      )
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>

            {/* Chat area */}
            <div className={`md:col-span-8 ${selectedWriter || userRole === 'writer' ? '' : 'hidden md:block'}`}>
              <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="border-b pb-4">
                  {selectedWriter ? (
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>
                          {selectedWriter.full_name 
                            ? selectedWriter.full_name.charAt(0).toUpperCase() 
                            : selectedWriter.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                        {selectedWriter.avatar_url && (
                          <AvatarImage src={selectedWriter.avatar_url} alt={selectedWriter.full_name || 'User'} />
                        )}
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedWriter.full_name || selectedWriter.email}
                        </CardTitle>
                        <CardDescription>
                          {selectedWriter.full_name ? selectedWriter.email : ''}
                        </CardDescription>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <MessageSquare className="h-6 w-6 mr-3 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">Messages</CardTitle>
                        <CardDescription>
                          {userRole === 'student' 
                            ? 'Select a writer to start chatting' 
                            : 'Select a student to view your conversation'}
                        </CardDescription>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  {selectedWriter ? (
                    <div className="h-full">
                      <ChatComponent recipientId={selectedWriter.id} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="bg-muted rounded-full p-6 mb-4">
                        <MessageSquare className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">Your messages</h3>
                      <p className="text-muted-foreground max-w-xs">
                        {userRole === 'student' 
                          ? 'Select a writer from the list to start a conversation' 
                          : 'Select a student conversation from the list'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
