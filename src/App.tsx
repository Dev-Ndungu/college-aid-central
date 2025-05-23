
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import { Toaster } from '@/components/ui/toaster';

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
import ResetPassword from '@/pages/ResetPassword';
import TermsAndConditions from '@/pages/TermsAndConditions';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import RefundPolicy from '@/pages/RefundPolicy';
import AssignmentChat from '@/pages/AssignmentChat';
import EditAssignment from '@/pages/EditAssignment';
import Checkout from '@/pages/Checkout';

// ScrollToTop component to reset scroll position
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <ScrollToTop />
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
              <Route path="/edit-assignment/:id" element={<EditAssignment />} />
              <Route path="/checkout/:assignmentId" element={<Checkout />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/assignment-chat/:assignmentId" element={<AssignmentChat />} />
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
