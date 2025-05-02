
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWriters, Writer } from '@/hooks/useWriters';
import ChatComponent from '@/components/chat/ChatComponent';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader, UserRound } from 'lucide-react';

const Messages = () => {
  const { isAuthenticated, isLoading: authLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const { writers, isLoading: writersLoading } = useWriters();
  const [selectedWriter, setSelectedWriter] = useState<Writer | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

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
        <div className="container mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-gray-600">
              {userRole === 'student' 
                ? 'Chat with our writers for help with your assignments' 
                : 'Chat with students about their assignments'}
            </p>
          </header>

          <div className="grid md:grid-cols-12 gap-6">
            {userRole === 'student' && (
              <div className={`md:col-span-${selectedWriter ? '3' : '12'}`}>
                {selectedWriter ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Writers</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedWriter(null)}
                          className="h-8 px-2"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Back
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-100 rounded-full p-2">
                          <UserRound className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedWriter.full_name || 'Writer'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedWriter.email}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select a Writer</CardTitle>
                      <CardDescription>
                        Choose a writer to start a conversation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {writersLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader className="h-6 w-6 animate-spin" />
                        </div>
                      ) : writers.length === 0 ? (
                        <p className="text-center py-4 text-gray-500">
                          No writers available at the moment.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {writers.map((writer) => (
                            <Button
                              key={writer.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setSelectedWriter(writer)}
                            >
                              <div className="flex items-center">
                                <div className="bg-gray-100 rounded-full p-2 mr-2">
                                  <UserRound className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="text-left">
                                  <p className="font-medium">
                                    {writer.full_name || 'Writer'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {writer.email}
                                  </p>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {(userRole === 'writer' || selectedWriter) && (
              <div className={`md:col-span-${selectedWriter ? '9' : '12'}`}>
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle>
                      {userRole === 'student' 
                        ? `Chat with ${selectedWriter?.full_name || 'Writer'}`
                        : 'Student Messages'
                      }
                    </CardTitle>
                    <CardDescription>
                      {userRole === 'student' 
                        ? 'Ask questions or request help with your assignments'
                        : 'Respond to student inquiries and provide assistance'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow overflow-hidden flex flex-col">
                    {selectedWriter && (
                      <ChatComponent 
                        recipientId={selectedWriter.id}
                      />
                    )}
                    
                    {/* For writers, we would show a list of conversations here */}
                    {userRole === 'writer' && (
                      <p className="text-center py-10 text-gray-500">
                        Writer message interface would go here. Select a student to chat with.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
