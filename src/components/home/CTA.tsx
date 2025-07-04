
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from 'lucide-react';

const CTA = () => {
  return (
    <section className="section bg-gradient-to-r from-brand-500 to-accent1-400 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-bold mb-6">Ready to Ace Your Assignments?</h2>
          <p className="text-lg mb-8 text-white/90">
            Join thousands of students who are already benefiting from our services. 
            Get started today and see the difference expert help can make.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-[#0d2241] text-white hover:bg-[#193764] transition-colors" asChild>
              <Link to="/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
            <Button size="lg" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link to="/submit-assignment">
                <FileText className="mr-2 h-4 w-4" /> Submit Assignment
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
