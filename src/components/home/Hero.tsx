
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from 'lucide-react';

const Hero = () => {
  return (
    <section className="hero bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="animate-fade-in">
            <h1 className="font-bold mb-4">
              Expert Help for Your <span className="gradient-text">Academic Writing</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Get professional assistance with your assignments, track your progress, and access valuable educational resources to improve your grades and reduce stress.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-[#0d2241] hover:bg-[#193764]" size="lg" asChild>
                <Link to="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-[#0d2241] text-[#0d2241] hover:bg-[#0d2241]/10" asChild>
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">Professional guidance from expert writers</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">24/7 support for urgent assignments</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">100% original content</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">Secure and confidential service</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" 
                alt="Student studying" 
                className="rounded-lg shadow-lg w-full max-w-md mx-auto animate-fade-in"
              />
              <img 
                src="/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png"
                alt="The Writers Hub Logo"
                className="absolute -bottom-6 -right-6 w-24 h-24 bg-white rounded-full p-2 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
