
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  UserRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import WriterDashboard from '@/components/dashboard/WriterDashboard';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { isAuthenticated, userEmail, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !userRole) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                  <span className="bg-brand-100 text-brand-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                    <UserRound className="h-3 w-3 mr-1" />
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600">Welcome back, {userEmail}</p>
              </div>
              
              {userRole === 'student' && (
                <Button onClick={() => navigate('/submit-assignment')}>
                  <Plus className="mr-2 h-4 w-4" /> New Assignment
                </Button>
              )}
            </div>
          </header>

          {userRole === 'student' ? <StudentDashboard /> : <WriterDashboard />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
