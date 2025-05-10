
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  return (
    <section className="section cta-gradient text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-bold mb-6">Ready to Ace Your Assignments?</h2>
          <p className="text-lg mb-8 text-white/90">
            Join thousands of students who are already benefiting from our services. 
            Get started today and see the difference expert help can make.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" 
              asChild
            >
              <Link to="/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" 
              asChild
            >
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
