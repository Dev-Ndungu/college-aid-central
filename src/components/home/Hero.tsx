
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PhoneCall, FileText, ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="hero bg-gradient-to-r from-white to-gray-100">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="font-bold mb-4">
            <span className="text-[#0d2241]">Expert Help for Your College & Uni Academic Writing.</span>{' '}
            <span className="text-[#c69c3f]">We also Offer Full Course Management</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-700 max-w-3xl">
            Get professional assistance with your assignments, track your progress, and access valuable educational resources to improve your grades and reduce stress all at affordable prices!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button className="bg-[#0d2241] hover:bg-[#193764] text-white font-medium" size="lg" asChild>
              <Link to="/signup">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" className="border-[#0d2241] text-[#0d2241] hover:bg-[#0d2241]/10" size="lg" asChild>
              <Link to="/how-it-works">
                How It Works
              </Link>
            </Button>
            
            <Button className="bg-[#28a745] hover:bg-[#218838] text-white font-medium" size="lg" asChild>
              <Link to="/contact">
                <PhoneCall className="mr-1 h-4 w-4" /> Get in Touch
              </Link>
            </Button>
          </div>
          
          <Button className="bg-[#4285f4] hover:bg-[#3367d6] text-white font-medium" size="lg" asChild>
            <Link to="/assignment-submission">
              <FileText className="mr-1 h-4 w-4" /> Submit Assignment
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
