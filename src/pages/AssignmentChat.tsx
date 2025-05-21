
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { usePresence } from '@/hooks/usePresence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AssignmentChat = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  
  // Initialize presence tracking
  usePresence();

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">
                Direct messaging has been removed from the platform. Please use the dashboard to manage your assignments.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => navigate('/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AssignmentChat;
