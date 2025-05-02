
import React, { useState } from 'react';
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
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';

const AssignmentSubmission = () => {
  const [date, setDate] = React.useState<Date>();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  
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
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to submit an assignment."
        });
        navigate('/login');
        return;
      }

      // Create the assignment in the database
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            title,
            subject,
            description,
            due_date: date ? date.toISOString() : null,
            user_id: user.id,
            status: 'in-progress',
            progress: 0
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Handle file upload if a file was selected
      if (selectedFile && data[0].id) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${data[0].id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `assignments/${fileName}`;

        // Upload the file to Supabase Storage
        // Note: You'd need to create a 'assignments' bucket in Supabase Storage
        // const { error: uploadError } = await supabase.storage
        //   .from('assignments')
        //   .upload(filePath, selectedFile);

        // if (uploadError) {
        //   console.error('Error uploading file:', uploadError);
        //   // Continue with the process even if the file upload fails
        // }
      }

      // Show success message
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been successfully submitted."
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "An error occurred while submitting your assignment."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Submit New Assignment</h1>
            <p className="text-gray-600">
              Fill out the form below with details about your assignment
            </p>
          </header>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
                <CardDescription>
                  Provide as much information as possible to get accurate assistance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Research Paper on Climate Change" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select required value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="computer-science">Computer Science</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Assignment Type</Label>
                  <Select required value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="research">Research Paper</SelectItem>
                      <SelectItem value="case-study">Case Study</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="problem-set">Problem Set</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Assignment Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Provide detailed instructions for your assignment..."
                    rows={5}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Files (Optional)</Label>
                  <div className="border border-dashed rounded-md p-10 text-center">
                    <Input
                      id="file"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="font-medium">Click to upload</span>
                      <span className="text-sm text-gray-500">
                        PDF, DOC, DOCX, or ZIP (Max 10MB)
                      </span>
                    </Label>
                    {selectedFile && (
                      <div className="mt-4 text-sm text-green-600 font-medium">
                        Selected: {selectedFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Assignment"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AssignmentSubmission;
