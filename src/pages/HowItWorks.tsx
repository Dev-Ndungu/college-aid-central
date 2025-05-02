
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { ArrowRight, Edit3, Clock, CheckCircle, MessageSquare, Shield, Settings, Award } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const steps = [
  {
    number: 1,
    title: "Create an Account",
    description: "Sign up with your email address and create a secure password to access our platform.",
    icon: <Edit3 className="h-12 w-12 text-white" />,
  },
  {
    number: 2,
    title: "Submit Your Assignment",
    description: "Fill out the assignment details form with instructions and upload any relevant files.",
    icon: <Edit3 className="h-12 w-12 text-white" />,
  },
  {
    number: 3,
    title: "Track Progress",
    description: "Follow the status of your assignment in real-time through our intuitive dashboard.",
    icon: <Clock className="h-12 w-12 text-white" />,
  },
  {
    number: 4,
    title: "Receive Completed Work",
    description: "Get your assignment delivered to your dashboard before your specified deadline.",
    icon: <CheckCircle className="h-12 w-12 text-white" />,
  },
  {
    number: 5,
    title: "Review & Feedback",
    description: "Review the assignment and provide feedback if any revisions are needed.",
    icon: <MessageSquare className="h-12 w-12 text-white" />,
  }
];

const features = [
  {
    title: "Confidentiality Guaranteed",
    description: "Your personal information is protected with industry-standard security measures.",
    icon: <Shield className="h-12 w-12 text-brand-500" />,
  },
  {
    title: "Customized Solutions",
    description: "Each assignment is tailored to your specific requirements and academic level.",
    icon: <Settings className="h-12 w-12 text-brand-500" />,
  },
  {
    title: "Quality Assurance",
    description: "Our multi-stage review process ensures high-quality, error-free assignments.",
    icon: <Award className="h-12 w-12 text-brand-500" />,
  }
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-br from-brand-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">How CollegeAidCentral Works</h1>
              <p className="text-lg text-gray-600 mb-8">
                Our simple process makes getting help with your assignments quick, reliable, and stress-free.
              </p>
              <Button size="lg" asChild>
                <Link to="/signup">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Simple 5-Step Process</h2>
              <p className="text-gray-600">
                From submission to delivery, we've designed a straightforward process to help you succeed in your academic journey.
              </p>
            </div>
            
            <div className="relative">
              {steps.map((step, index) => (
                <div key={index} className="mb-16 relative">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                      <div className="flex flex-col items-center">
                        <div className="bg-brand-500 rounded-full p-6 mb-3">
                          {step.icon}
                        </div>
                        <span className="text-xl font-bold text-brand-500">Step {step.number}</span>
                      </div>
                    </div>
                    <div className="md:w-2/3">
                      <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute h-16 w-px bg-gray-300 left-1/3 -bottom-10"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Guarantees</h2>
              <p className="text-gray-600">
                We're committed to providing reliable and high-quality academic assistance. Here's what you can expect from us.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center card-hover">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-brand-500 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-lg mb-8 text-white/90">
                Create an account today and take the first step toward academic success.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-white text-brand-500 hover:bg-gray-100" asChild>
                  <Link to="/signup">Create Account</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
