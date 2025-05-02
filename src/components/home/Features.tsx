
import React from 'react';
import { 
  Clock, Shield, Award, BookOpen, BookmarkCheck, Users, 
  FileText, AlertCircle, MessageSquare 
} from 'lucide-react';

const features = [
  {
    icon: <Clock className="h-6 w-6 text-brand-500" />,
    title: "Meet Deadlines",
    description: "Never miss an assignment deadline with our priority delivery system."
  },
  {
    icon: <Shield className="h-6 w-6 text-brand-500" />,
    title: "100% Confidential",
    description: "Your personal information is secured with our strict privacy policy."
  },
  {
    icon: <Award className="h-6 w-6 text-brand-500" />,
    title: "Quality Guaranteed",
    description: "Our experts deliver high-quality work that meets academic standards."
  },
  {
    icon: <BookOpen className="h-6 w-6 text-brand-500" />,
    title: "All Subjects",
    description: "Get help with any subject, from humanities to advanced sciences."
  },
  {
    icon: <BookmarkCheck className="h-6 w-6 text-brand-500" />,
    title: "Original Content",
    description: "Every assignment is written from scratch to avoid plagiarism."
  },
  {
    icon: <Users className="h-6 w-6 text-brand-500" />,
    title: "Expert Tutors",
    description: "Work with experienced tutors with advanced degrees in their fields."
  },
  {
    icon: <FileText className="h-6 w-6 text-brand-500" />,
    title: "Detailed Research",
    description: "Comprehensive research using reliable and current academic sources."
  },
  {
    icon: <AlertCircle className="h-6 w-6 text-brand-500" />,
    title: "Unlimited Revisions",
    description: "Request changes until you're completely satisfied with your assignment."
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-brand-500" />,
    title: "24/7 Support",
    description: "Our customer support team is available around the clock to assist you."
  }
];

const Features = () => {
  return (
    <section className="section bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-bold mb-4">Why Choose CollegeAidCentral?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We provide comprehensive support to help you excel in your academic journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm card-hover"
            >
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
