import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Upload, X, FileText, File } from 'lucide-react';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AssignmentSubmissionConfirmation from '@/components/dialogs/AssignmentSubmissionConfirmation';

// Comprehensive assignment types based on the provided list
const assignmentTypes = [
  { value: 'essay', label: 'Essay' },
  { value: 'research-paper', label: 'Research Paper' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'discussion-post', label: 'Discussion Post' },
  { value: 'quiz-exam', label: 'Quiz or Exam' },
  { value: 'lab-report', label: 'Lab Report' },
  { value: 'group-project', label: 'Group Project' },
  { value: 'annotated-bibliography', label: 'Annotated Bibliography' },
  { value: 'reflective-journal', label: 'Reflective Journal' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'programming', label: 'Programming Assignment' },
  { value: 'problem-set', label: 'Problem Set' },
  { value: 'capstone', label: 'Capstone Project' },
  { value: 'thesis', label: 'Thesis/Dissertation' },
  { value: 'other', label: 'Other' }
];

// Comprehensive subject list based on the provided categories
const subjects = [
  // STEM
  { value: 'computer-science', label: 'Computer Science / IT', category: 'STEM' },
  { value: 'data-science', label: 'Data Science / AI / Cybersecurity', category: 'STEM' },
  { value: 'biology', label: 'Biology / Biotechnology', category: 'STEM' },
  { value: 'physics', label: 'Physics', category: 'STEM' },
  { value: 'chemistry', label: 'Chemistry', category: 'STEM' },
  { value: 'mathematics', label: 'Mathematics / Statistics', category: 'STEM' },
  { value: 'engineering', label: 'Engineering', category: 'STEM' },
  { value: 'environmental-science', label: 'Environmental Science', category: 'STEM' },
  
  // Humanities and Social Sciences
  { value: 'history', label: 'History', category: 'Humanities' },
  { value: 'political-science', label: 'Political Science', category: 'Humanities' },
  { value: 'sociology', label: 'Sociology / Anthropology', category: 'Humanities' },
  { value: 'psychology', label: 'Psychology', category: 'Humanities' },
  { value: 'philosophy', label: 'Philosophy / Religious Studies', category: 'Humanities' },
  { value: 'english', label: 'English Literature / Writing', category: 'Humanities' },
  { value: 'linguistics', label: 'Linguistics / Communication', category: 'Humanities' },
  
  // Business and Economics
  { value: 'accounting', label: 'Accounting / Finance', category: 'Business' },
  { value: 'marketing', label: 'Marketing / Advertising', category: 'Business' },
  { value: 'business', label: 'Business Administration / Management', category: 'Business' },
  { value: 'entrepreneurship', label: 'Entrepreneurship', category: 'Business' },
  { value: 'international-business', label: 'International Business', category: 'Business' },
  { value: 'economics', label: 'Economics', category: 'Business' },
  
  // Health and Medicine
  { value: 'nursing', label: 'Nursing', category: 'Health' },
  { value: 'public-health', label: 'Public Health', category: 'Health' },
  { value: 'medicine', label: 'Pre-Med / Medicine / Dental', category: 'Health' },
  { value: 'physical-therapy', label: 'Physical Therapy / Occupational Therapy', category: 'Health' },
  { value: 'nutrition', label: 'Nutrition / Kinesiology', category: 'Health' },
  
  // Education
  { value: 'early-education', label: 'Early Childhood Education', category: 'Education' },
  { value: 'special-education', label: 'Special Education', category: 'Education' },
  { value: 'curriculum', label: 'Curriculum and Instruction', category: 'Education' },
  { value: 'education-leadership', label: 'Educational Leadership', category: 'Education' },
  
  // Arts and Design
  { value: 'graphic-design', label: 'Graphic Design / UX/UI', category: 'Arts' },
  { value: 'fine-arts', label: 'Fine Arts / Studio Art', category: 'Arts' },
  { value: 'music', label: 'Music / Performing Arts', category: 'Arts' },
  { value: 'film', label: 'Film / Media Studies', category: 'Arts' },
  { value: 'fashion', label: 'Fashion Design / Interior Design', category: 'Arts' },
  
  // Law and Legal Studies
  { value: 'pre-law', label: 'Pre-Law', category: 'Law' },
  { value: 'criminal-justice', label: 'Criminal Justice', category: 'Law' },
  { value: 'paralegal', label: 'Paralegal Studies', category: 'Law' },
  
  // International and Interdisciplinary Studies
  { value: 'international-relations', label: 'International Relations', category: 'International' },
  { value: 'global-studies', label: 'Global Studies', category: 'International' },
  { value: 'gender-studies', label: 'Gender and Ethnic Studies', category: 'International' },
  { value: 'american-studies', label: 'American Studies', category: 'International' },
  
  { value: 'other', label: 'Other', category: 'Other' }
];

interface FileObject {
  name: string;
  size: number;
  type: string;
  file: File;
  url?: string;
}

const AssignmentSubmission = () => {
  const [date, setDate] = React.useState<Date>();
  const [selectedFiles, setSelectedFiles] = React.useState<FileObject[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{[key: string]: number}>({});
  const { isAuthenticated, userRole, userEmail, userId } = useAuth();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [assignmentType, setAssignmentType] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    // Redirect to login if not authenticated or if user is a writer
    if (!isAuthenticated) {
      navigate('/login');
    } else if (userRole === 'writer') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    // Convert FileList to array and map to our FileObject format
    const newFiles = Array.from(fileList).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Reset the input so the same file can be selected again if removed
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (fileType.includes('image')) return <File className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('assignment_files')
      .upload(filePath, file, {
        cacheControl: '3600',
      });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assignment_files')
      .getPublicUrl(data.path);
      
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get the current user from profiles
      if (!userEmail) {
        toast.error("User email not available. Please log in again.");
        navigate('/login');
        return;
      }

      // Get the user ID from profiles using email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (profileError || !profileData) {
        throw new Error("Could not find your user profile. Please log in again.");
      }

      // Upload all files first and collect their URLs
      const fileUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            // Update progress state
            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
            
            // Upload file and get public URL
            const publicUrl = await uploadFileToSupabase(file.file);
            fileUrls.push(publicUrl);
            
            // Update progress
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          } catch (err) {
            console.error(`Error uploading file ${file.name}:`, err);
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }

      console.log("Creating assignment with user ID:", profileData.id);

      // Create the assignment in the database with more logging
      const assignmentData = {
        title,
        subject,
        description,
        due_date: date ? date.toISOString() : null,
        user_id: profileData.id,
        status: 'submitted',
        progress: 0,
        file_urls: fileUrls.length > 0 ? fileUrls : null
      };
      
      console.log("Assignment data to submit:", assignmentData);
      
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select();

      if (error) {
        console.error("Error submitting assignment:", error);
        throw error;
      }

      console.log("Assignment created successfully:", data);
      
      // Manually trigger the notification to writers
      try {
        console.log("Triggering notification to writers");
        const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-message`;
        
        const notificationPayload = {
          type: 'assignment_submitted',
          assignment: data[0]
        };
        
        console.log("Notification payload:", JSON.stringify(notificationPayload));
        
        const notifyResponse = await fetch(notifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(notificationPayload),
        });
        
        if (!notifyResponse.ok) {
          const responseText = await notifyResponse.text();
          console.error("Notification API error:", notifyResponse.status, responseText);
        } else {
          const responseJson = await notifyResponse.json();
          console.log("Notification sent successfully:", responseJson);
        }
      } catch (notifyError) {
        console.error("Error sending assignment notification:", notifyError);
      }

      // Show success message
      toast.success("Your assignment has been successfully submitted and is now available for writers to view.");

      // Show confirmation dialog instead of redirecting immediately
      setShowConfirmation(true);
      
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast.error(error.message || "An error occurred while submitting your assignment.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Submit New Assignment</h1>
            <p className="text-gray-600">
              Fill out the form below with details about your assignment
            </p>
          </header>

          <Card className="shadow-md">
            <form onSubmit={handleSubmit}>
              <CardHeader className="border-b bg-gray-50 rounded-t-lg">
                <CardTitle>Assignment Details</CardTitle>
                <CardDescription>
                  Provide as much information as possible to get accurate assistance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Assignment Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g., Research Paper on Climate Change" 
                        required 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select required value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {/* Group subjects by category */}
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b">
                            STEM
                          </div>
                          {subjects
                            .filter(s => s.category === 'STEM')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b mt-2">
                            Humanities and Social Sciences
                          </div>
                          {subjects
                            .filter(s => s.category === 'Humanities')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b mt-2">
                            Business and Economics
                          </div>
                          {subjects
                            .filter(s => s.category === 'Business')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b mt-2">
                            Health and Medicine
                          </div>
                          {subjects
                            .filter(s => s.category === 'Health')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b mt-2">
                            Education
                          </div>
                          {subjects
                            .filter(s => s.category === 'Education')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b mt-2">
                            Arts and Design
                          </div>
                          {subjects
                            .filter(s => s.category === 'Arts')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b mt-2">
                            Law and Legal Studies
                          </div>
                          {subjects
                            .filter(s => s.category === 'Law')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <div className="font-semibold text-xs uppercase text-muted-foreground px-2 py-1.5 border-b mt-2">
                            International and Interdisciplinary Studies
                          </div>
                          {subjects
                            .filter(s => s.category === 'International')
                            .map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          }
                          
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Assignment Type</Label>
                      <Select required value={assignmentType} onValueChange={setAssignmentType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select assignment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignmentTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Select a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Assignment Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Provide detailed instructions for your assignment..."
                        rows={6}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 border-t pt-6">
                  <Label>Upload Files</Label>
                  <div className="border border-dashed rounded-md p-6 text-center hover:bg-gray-50 transition-colors">
                    <Input
                      id="file"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                    />
                    <Label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="font-medium">Click to upload</span>
                      <span className="text-sm text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG, or ZIP (Max 10MB)
                      </span>
                    </Label>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-3">Selected Files</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedFiles.map((file, index) => (
                          <div 
                            key={`${file.name}-${index}`} 
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-md border"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {getFileIcon(file.type)}
                              <div className="text-sm">
                                <p className="font-medium truncate max-w-[200px] md:max-w-[300px]">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t py-4 bg-gray-50 rounded-b-lg">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#0d2241] hover:bg-[#193764]">
                  {loading ? "Submitting..." : "Submit Assignment"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* Confirmation dialog */}
      <AssignmentSubmissionConfirmation 
        open={showConfirmation} 
        onOpenChange={(open) => {
          setShowConfirmation(open);
          if (!open) {
            navigate('/dashboard');
          }
        }}
      />
    </div>
  );
};

export default AssignmentSubmission;
