
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, Phone, MapPin, MessageSquare, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// FAQ data
const faqs = [
  {
    question: "How does the assignment submission process work?",
    answer: "To submit an assignment, simply log into your account, click on 'New Assignment,' and fill out the assignment details form. You can upload any relevant files and provide instructions for your assignment. Once submitted, you'll be able to track its progress through your dashboard."
  },
  {
    question: "What subject areas do you cover?",
    answer: "We cover a wide range of academic subjects including but not limited to: Business, Computer Science, Economics, Engineering, English Literature, History, Mathematics, Psychology, Sciences, and more. If you're unsure about your specific subject, please contact us for confirmation."
  },
  {
    question: "How quickly can I get my assignment completed?",
    answer: "Turnaround times vary depending on the complexity and length of your assignment. Simple assignments might be completed within 24-48 hours, while more complex projects may take several days. We always work to meet your specified deadline and will inform you if there are any concerns about timing."
  },
  {
    question: "Is my personal information kept confidential?",
    answer: "Yes, we take privacy and confidentiality very seriously. Your personal information is protected by our strict privacy policy and is never shared with third parties. All communication between you and our team is kept completely confidential."
  },
  {
    question: "Can I request revisions if I'm not satisfied?",
    answer: "Absolutely! We offer a revision policy to ensure your complete satisfaction. If you feel that your completed assignment needs changes, you can request revisions through your dashboard, and our team will address your concerns promptly."
  },
  {
    question: "Do you guarantee originality?",
    answer: "Yes, all assignments are written from scratch and are 100% original. We use plagiarism detection software to ensure that all content is unique and properly cited when academic sources are used."
  },
];

const Contact = () => {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      alert('Message sent successfully! This functionality will be implemented with backend integration.');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have questions or need assistance? Our team is ready to help you with any inquiries about our services.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center bg-white rounded-lg p-6 border border-gray-200 shadow-sm card-hover">
              <div className="mx-auto bg-brand-100 text-brand-500 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="text-gray-600 mb-3">For general inquiries and support</p>
              <a href="mailto:info@collegeaidcentral.com" className="text-brand-500 font-medium hover:underline">
                info@collegeaidcentral.com
              </a>
            </div>
            
            <div className="text-center bg-white rounded-lg p-6 border border-gray-200 shadow-sm card-hover">
              <div className="mx-auto bg-brand-100 text-brand-500 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="text-gray-600 mb-3">Mon-Fri from 9am to 5pm EST</p>
              <a href="tel:+1234567890" className="text-brand-500 font-medium hover:underline">
                (123) 456-7890
              </a>
            </div>
            
            <div className="text-center bg-white rounded-lg p-6 border border-gray-200 shadow-sm card-hover">
              <div className="mx-auto bg-brand-100 text-brand-500 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-3">Get immediate assistance</p>
              <Button variant="outline" className="hover:bg-brand-50">
                Start Chat
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" rows={5} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <div>
              <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
