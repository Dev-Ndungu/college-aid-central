
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Upload, X, FileText, File, ArrowRight, CheckCircle, Phone, Mail, Paperclip } from 'lucide-react';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase, submitAnonymousAssignment } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AssignmentSubmissionConfirmation from '@/components/dialogs/AssignmentSubmissionConfirmation';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
const Hero = () => {
  const whatsappNumber = "0797280930";
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [showLoginOption, setShowLoginOption] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [countryCode, setCountryCode] = useState("+1");
  const {
    isAuthenticated,
    userId
  } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Country code options
  const countryCodes = [{
    value: "+91",
    label: "+91 (IN)"
  }, {
    value: "+1",
    label: "+1 (US)"
  }, {
    value: "+44",
    label: "+44 (GB UK)"
  }, {
    value: "+61",
    label: "+61 (AU AUS)"
  }, {
    value: "+81",
    label: "+81 (JP)"
  }, {
    value: "+971",
    label: "+971 (AE UAE)"
  }, {
    value: "+880",
    label: "+880 (BD)"
  }, {
    value: "+92",
    label: "+92 (PK)"
  }];

  // Form validation schema
  const formSchema = z.object({
    title: z.string().min(3, {
      message: "Title must be at least 3 characters."
    }),
    subject: z.string().min(2, {
      message: "Subject is required."
    }),
    description: z.string().optional(),
    name: z.string().min(2, {
      message: "Your name is required."
    }),
    email: z.string().email({
      message: "Please enter a valid email address."
    }),
    phone: z.string().optional(),
    due_date: z.string().optional(),
    university: z.string().optional(),
    terms: z.boolean().refine(val => val === true, {
      message: "You must accept the terms and conditions."
    })
  });

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subject: "",
      description: "",
      name: "",
      email: "",
      phone: "",
      due_date: "",
      university: "",
      terms: false
    }
  });
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };
  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(files => files.filter(file => file !== fileToRemove));
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Upload file to Supabase storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `assignments/${fileName}`;
      const {
        data,
        error
      } = await supabase.storage.from('assignment_files').upload(filePath, file);
      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      // Get the public URL
      const {
        data: publicUrlData
      } = supabase.storage.from('assignment_files').getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('File upload error:', err);
      return null;
    }
  };
  
  // Function to send notification to writers
  const sendNotificationToWriters = async (assignment: any) => {
    try {
      console.log('Sending notification about new anonymous assignment from home page');
      
      // Use hardcoded values for Supabase URL and project reference
      const projectRef = "ihvgtaxvrqdnrgdddhdx";
      console.log('Project ref:', projectRef);
      
      // Construct the proper edge function URL
      const notifyUrl = `https://${projectRef}.supabase.co/functions/v1/notify-message`;
      console.log('Constructed notify URL:', notifyUrl);
      
      const notificationPayload = {
        type: 'assignment_submitted',
        assignment: assignment
      };
      console.log('Notification payload:', JSON.stringify(notificationPayload));
      
      const notifyResponse = await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No authorization header needed since we've made the function public
        },
        body: JSON.stringify(notificationPayload),
      });
      
      if (!notifyResponse.ok) {
        const responseText = await notifyResponse.text();
        console.error('Notification API error:', notifyResponse.status, responseText);
        throw new Error(`Notification API error: ${notifyResponse.status} ${responseText}`);
      } else {
        const responseJson = await notifyResponse.json();
        console.log('Anonymous assignment notification sent successfully:', responseJson);
        return true;
      }
    } catch (error: any) {
      console.error('Error sending assignment submission notification:', error);
      return false;
    }
  };
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Format the phone number with country code
      const formattedPhone = data.phone ? `${countryCode}${data.phone.replace(/^0+/, '')}` : null;

      // Upload files and collect URLs
      const fileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        toast("Uploading files...");
        for (const file of selectedFiles) {
          const url = await uploadFile(file);
          if (url) fileUrls.push(url);
        }
      }

      // Prepare assignment data
      const assignmentData = {
        title: data.title,
        subject: data.subject,
        description: data.description || null,
        status: "submitted",
        student_name: data.name,
        student_email: data.email,
        student_phone: formattedPhone,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        file_urls: fileUrls.length > 0 ? fileUrls : null
      };
      if (isAuthenticated && userId) {
        // For authenticated users, use their ID
        const {
          data: result,
          error
        } = await supabase.from('assignments').insert([{
          ...assignmentData,
          user_id: userId
        }]).select();
        if (error) {
          console.error("Error submitting assignment:", error);
          toast.error("Failed to submit your assignment");
          throw error;
        }
        toast.success("Your assignment was submitted successfully!");
        console.log("Assignment submitted:", result);
        
        // Send notification to writers
        await sendNotificationToWriters(result[0]);
      } else {
        // Anonymous submission - use our helper function
        try {
          const result = await submitAnonymousAssignment(assignmentData);
          toast.success("Your assignment was submitted successfully!");
          console.log("Anonymous assignment submitted:", result);
          
          // Send notification to writers
          await sendNotificationToWriters(result[0]);
        } catch (error: any) {
          console.error("Error in anonymous submission:", error);
          toast.error("Failed to submit your assignment");
          throw error;
        }
      }

      // Close the submission dialog and show confirmation instead
      setSubmissionDialogOpen(false);
      form.reset();
      setSelectedFiles([]);
      setShowConfirmation(true);
    } catch (err) {
      console.error("Error in submission process:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };
  const handleSubmitClick = () => {
    if (!isAuthenticated) {
      setShowLoginOption(true);
    } else {
      setShowLoginOption(false);
    }
    setSubmissionDialogOpen(true);
  };

  // Academic-themed images for the carousel - expanded to 20 images
  const carouselImages = [{
    src: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Person writing in a notebook"
  }, {
    src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Student studying at library"
  }, {
    src: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Studying with textbooks and laptop"
  }, {
    src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Taking notes during research"
  }, {
    src: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Student working on assignment"
  }, {
    src: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Books and writing materials"
  }, {
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Coding and academic research"
  }, {
    src: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Student preparing for exams"
  }, {
    src: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Programming and academic projects"
  }, {
    src: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Creative thinking and problem solving"
  }, {
    src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Group study session"
  }, {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Research and writing"
  }, {
    src: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Digital learning resources"
  }, {
    src: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Online studying with laptop"
  }, {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Technology and education"
  }, {
    src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Computer programming assignment"
  }, {
    src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Remote learning and productivity"
  }, {
    src: "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Note-taking and organization"
  }, {
    src: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Software development learning"
  }, {
    src: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    alt: "Modern technology in education"
  }];

  // Auto-rotate carousel slides
  const [api, setApi] = useState<any>(null);
  const onSelect = useCallback(() => {
    if (!api) return;
  }, [api]);

  // Auto-rotation effect for the carousel
  useEffect(() => {
    if (!api) return;

    // Set up the onSelect event to track the selected slide
    api.on("select", onSelect);

    // Auto-rotate slides every 3 seconds
    const autoplayInterval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    // Cleanup function to remove event listeners and clear interval
    return () => {
      api.off("select", onSelect);
      clearInterval(autoplayInterval);
    };
  }, [api, onSelect]);
  return <section className="hero bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="animate-fade-in">
            <h1 className="font-bold mb-4">
              Expert Help for Your <span className="gradient-text">College &amp; Uni Academic Writing. We also Offer Full Course  Management</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">Get professional assistance with your assignments, track your progress, and access valuable educational resources to improve your grades and reduce stress all at affordable prices !</p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-[#0d2241] hover:bg-[#193764]" size="lg" asChild>
                <Link to="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-[#0d2241] text-[#0d2241] hover:bg-[#0d2241]/10" asChild>
                <Link to="/how-it-works">How It Works</Link>
              </Button>
              <Button size="lg" variant="secondary" className="bg-green-600 hover:bg-green-700 text-white" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-4 w-4" /> Get in Touch
                </a>
              </Button>
              <Button size="lg" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmitClick}>
                <FileText className="mr-2 h-4 w-4" /> Submit Assignment
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
              <Carousel setApi={setApi} className="w-full max-w-md mx-auto" opts={{
              align: "start",
              loop: true
            }}>
                <CarouselContent>
                  {carouselImages.map((image, index) => <CarouselItem key={index}>
                      <div className="relative">
                        <img src={image.src} alt={image.alt} className="rounded-lg shadow-lg w-full aspect-[4/3] object-cover animate-fade-in" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 rounded-b-lg">
                          <p className="text-sm font-medium">{image.alt}</p>
                        </div>
                      </div>
                    </CarouselItem>)}
                </CarouselContent>
                <CarouselPrevious className="left-2 bg-white/80 hover:bg-white" />
                <CarouselNext className="right-2 bg-white/80 hover:bg-white" />
              </Carousel>
              
              <img src="/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png" alt="The Assignment Hub Logo" className="absolute -bottom-6 -right-6 w-24 h-24 bg-white rounded-full p-2 shadow-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Submission Dialog */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Submit Your Assignment</DialogTitle>
            <DialogDescription>
              {showLoginOption && <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="font-medium text-blue-800 mb-2">Already have an account?</p>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild size="sm">
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button onClick={() => setShowLoginOption(false)} variant="default" size="sm">
                      Continue without account
                    </Button>
                  </div>
                </div>}
              <p className="mt-2">Fill in the details below to get help with your assignment.</p>
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField control={form.control} name="title" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Assignment Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="subject" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subject name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="description" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter assignment details" className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>
                
                <div className="space-y-4">
                  <FormField control={form.control} name="name" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Your Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="phone" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex gap-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map(code => <SelectItem key={code.value} value={code.value}>
                                  {code.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} className="flex-1" />
                          </FormControl>
                        </div>
                        <FormDescription className="text-xs">
                          WhatsApp number (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="university" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>University</FormLabel>
                          <FormControl>
                            <Input placeholder="University name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    
                    <FormField control={form.control} name="due_date" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>
              </div>
              
              {/* File Upload Section */}
              <div className="space-y-2">
                <FormLabel>Attachments</FormLabel>
                <div className="border border-dashed rounded-md p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} multiple />
                  <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                    <Paperclip className="h-6 w-6 text-gray-400 mb-2" />
                    <span className="text-sm font-medium">Click to upload files</span>
                    <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</span>
                  </label>
                </div>
                
                {/* Display selected files */}
                {selectedFiles.length > 0 && <div className="mt-2 space-y-2">
                    {selectedFiles.map((file, index) => <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm border">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500 text-xs">({formatFileSize(file.size)})</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file)} className="h-6 w-6 p-0">
                          &times;
                        </Button>
                      </div>)}
                  </div>}
              </div>
              
              <FormField control={form.control} name="terms" render={({
              field
            }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        I accept the <Link to="/terms-and-conditions" className="text-blue-600 hover:underline" target="_blank">Terms and Conditions</Link>, agree to receive offers & updates
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>} />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSubmissionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0d2241] hover:bg-[#193764]">
                  Submit Assignment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AssignmentSubmissionConfirmation open={showConfirmation} onOpenChange={setShowConfirmation} />
    </section>;
};
export default Hero;
