
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import AssignmentChatComponent from '@/components/chat/AssignmentChatComponent';
import { toast } from 'sonner';

const AssignmentChat = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const { assignmentId } = useParams<{ assignmentId: string }>();

  useEffect(() => {
    // Validate that assignmentId exists
    if (!assignmentId) {
      toast.error("No assignment ID provided");
    }
  }, [assignmentId]);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        {assignmentId ? (
          <AssignmentChatComponent assignmentId={assignmentId} />
        ) : (
          <div className="container mx-auto p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="mt-2">No assignment ID was provided in the URL.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AssignmentChat;
