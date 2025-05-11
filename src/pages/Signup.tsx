
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SignupForm from '@/components/auth/SignupForm';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const Signup = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 w-full py-8 px-4">
        <Card className={`w-full ${isMobile ? 'max-w-[95%]' : 'max-w-md'} space-y-6 p-6 md:p-8 rounded-xl shadow-sm`}>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold">Create Account</h1>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Join our platform to get expert assistance with your assignments
            </p>
          </div>
          
          <SignupForm />
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
