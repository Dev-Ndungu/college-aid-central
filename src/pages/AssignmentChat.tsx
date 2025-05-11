
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import AssignmentChatComponent from '@/components/chat/AssignmentChatComponent';
import { usePresence } from '@/hooks/usePresence';

const AssignmentChat = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  
  // Initialize presence tracking
  usePresence();

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <AssignmentChatComponent assignmentId={assignmentId} />
      </main>
      <Footer />
    </div>
  );
};

export default AssignmentChat;
