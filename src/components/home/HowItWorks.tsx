
import React from 'react';
import { Edit3, Clock, FileCheck, MessageSquare } from 'lucide-react';

const steps = [
  {
    icon: <Edit3 className="h-10 w-10 text-white" />,
    title: "Submit Your Assignment",
    description: "Fill out our simple form with the details of your assignment and upload any relevant files."
  },
  {
    icon: <Clock className="h-10 w-10 text-white" />,
    title: "Track Progress",
    description: "Follow the status of your assignment in real-time through our intuitive progress tracker."
  },
  {
    icon: <FileCheck className="h-10 w-10 text-white" />,
    title: "Receive Completed Work",
    description: "Get your completed assignment delivered to your dashboard before your deadline."
  },
  {
    icon: <MessageSquare className="h-10 w-10 text-white" />,
    title: "Review & Feedback",
    description: "Review the work and provide feedback to ensure it meets all your requirements."
  }
];

const HowItWorks = () => {
  return (
    <section className="section bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-bold mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our straightforward process makes getting help with your assignments quick and easy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center card-hover">
              <div className="bg-brand-500 rounded-full p-5 mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              <div className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gray-200" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
