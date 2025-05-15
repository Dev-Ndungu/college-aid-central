import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignments } from '@/hooks/useAssignments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import FileAttachments from '@/components/assignment/FileAttachments';
import { v4 as uuidv4 } from 'uuid';
import { Link as RouterLink } from 'react-router-dom';

const Hero = () => {
  const { isAuthenticated, userId } = useAuth();
  const { createAssignment } = useAssignments();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    countryCode: '+1',
    agreeToTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, agreeToTerms: checked });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      toast.error("You must agree to the terms and conditions to submit");
      return;
    }

    try {
      setIsSubmitting(true);

      // Process file uploads first
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `assignments/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(filePath, file);
          
        if (uploadError) {
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }

      // Prepare assignment data
      const assignmentData = {
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        status: 'submitted',
        file_urls: [...fileUrls, ...uploadedUrls],
        user_id: userId || '00000000-0000-0000-0000-000000000000', // Use a default ID for anonymous submissions
        student_name: formData.studentName,
        student_email: formData.studentEmail,
        student_phone: formData.countryCode + formData.studentPhone
      };

      // Create the assignment
      await createAssignment(assignmentData);
      
      toast.success("Assignment submitted successfully!");
      
      // Reset form
      setFormData({
        title: '',
        subject: '',
        description: '',
        studentName: '',
        studentEmail: '',
        studentPhone: '',
        countryCode: '+1',
        agreeToTerms: false
      });
      setFiles([]);
      setFileUrls([]);
      
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      toast.error(error.message || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of the component remains the same
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Get Expert Help with Your Academic Assignments
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Submit your assignment and connect with qualified writers who will help you succeed in your academic journey.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="px-8">Submit Assignment</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit Your Assignment</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to submit your assignment to our writer team.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleFormSubmit} className="space-y-6 py-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Assignment Title</Label>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Research Paper on Climate Change"
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="e.g., Environmental Science, History, Mathematics"
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description & Requirements</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your assignment, including word count, formatting requirements, and any specific instructions"
                          className="min-h-[120px]"
                        />
                      </div>
                      
                      {!isAuthenticated && (
                        <>
                          <div className="grid gap-2">
                            <Label htmlFor="studentName">Your Name</Label>
                            <Input
                              id="studentName"
                              name="studentName"
                              value={formData.studentName}
                              onChange={handleInputChange}
                              placeholder="Enter your full name"
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="studentEmail">Email Address</Label>
                            <Input
                              id="studentEmail"
                              name="studentEmail"
                              type="email"
                              value={formData.studentEmail}
                              onChange={handleInputChange}
                              placeholder="Your email address for communication"
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="studentPhone">Phone Number (Optional)</Label>
                            <div className="flex">
                              <select
                                id="countryCode"
                                name="countryCode"
                                value={formData.countryCode}
                                onChange={handleInputChange}
                                className="w-24 rounded-l-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                              >
                                <option value="+1">+1 (US)</option>
                                <option value="+44">+44 (UK)</option>
                                <option value="+61">+61 (AU)</option>
                                <option value="+91">+91 (IN)</option>
                                <option value="+86">+86 (CN)</option>
                                <option value="+49">+49 (DE)</option>
                                <option value="+33">+33 (FR)</option>
                                <option value="+81">+81 (JP)</option>
                                <option value="+7">+7 (RU)</option>
                                <option value="+55">+55 (BR)</option>
                              </select>
                              <Input
                                id="studentPhone"
                                name="studentPhone"
                                value={formData.studentPhone}
                                onChange={handleInputChange}
                                placeholder="Phone number"
                                className="flex-1 rounded-l-none"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="grid gap-2">
                        <Label>Attachments</Label>
                        <FileAttachments
                          files={files}
                          setFiles={setFiles}
                          fileUrls={fileUrls}
                          setFileUrls={setFileUrls}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="terms" 
                          checked={formData.agreeToTerms}
                          onCheckedChange={handleCheckboxChange}
                          required
                        />
                        <label htmlFor="terms" className="text-sm text-muted-foreground">
                          I agree to the <RouterLink to="/terms-and-conditions" className="text-primary underline hover:text-primary/80">terms and conditions</RouterLink>
                        </label>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Assignment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="px-8">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm lg:max-w-none">
            <img
              alt="Assignment Hub"
              className="aspect-square overflow-hidden rounded-xl object-cover w-full"
              height="550"
              src="/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png"
              width="550"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
