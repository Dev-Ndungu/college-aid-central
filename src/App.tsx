
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from 'react';
import { toast } from 'sonner';
import { checkDatabaseConfig } from '@/utils/dbCheck';

import { AuthProvider } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import HowItWorks from '@/pages/HowItWorks';
import Resources from '@/pages/Resources';
import Contact from '@/pages/Contact';
import Messages from '@/pages/Messages';
import NotFound from '@/pages/NotFound';
import ProfileCompletion from '@/pages/ProfileCompletion';
import AssignmentSubmission from '@/pages/AssignmentSubmission';

import './App.css';

function App() {
  // Check database configuration on app start
  useEffect(() => {
    const checkDb = async () => {
      const result = await checkDatabaseConfig();
      if (!result.success) {
        toast.error(result.message);
        console.error("Database configuration issue:", result.message);
      }
    };
    
    checkDb();
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile-completion" element={<ProfileCompletion />} />
          <Route path="/submit-assignment" element={<AssignmentSubmission />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
