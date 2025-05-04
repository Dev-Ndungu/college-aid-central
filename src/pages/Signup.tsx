
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SignupForm from '@/components/auth/SignupForm';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const Signup = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md space-y-8 p-8 rounded-xl shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="mt-2 text-gray-600">
              Join our platform to get expert assistance with your assignments
            </p>
          </div>
          
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600 mr-2" />
            <AlertDescription className="text-blue-700">
              Make sure to select your role (Student or Writer) before clicking "Continue with Google"
            </AlertDescription>
          </Alert>
          
          <SignupForm />
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
