
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import { Toaster } from 'sonner';

// Import routes
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Contact from '@/pages/Contact';
import ResourcesPage from '@/pages/Resources';
import Profile from '@/pages/Profile';
import ProfileCompletion from '@/pages/ProfileCompletion';
import NotFound from '@/pages/NotFound';
import HowItWorksPage from '@/pages/HowItWorks';
import AssignmentSubmission from '@/pages/AssignmentSubmission';
import StudentAssignmentSubmission from '@/pages/StudentAssignmentSubmission';
import Messages from '@/pages/Messages';
import AssignmentChat from '@/pages/AssignmentChat';
import ResetPassword from '@/pages/ResetPassword';

function App() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile-completion" element={<ProfileCompletion />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/submit-assignment" element={<AssignmentSubmission />} />
              <Route path="/new-assignment" element={<StudentAssignmentSubmission />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/assignment-chat/:assignmentId" element={<AssignmentChat />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
