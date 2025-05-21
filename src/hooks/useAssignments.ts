
import { useState, useEffect } from 'react';
import { supabase, submitAnonymousAssignment } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  status: string;
  progress: number | null;
  due_date: string | null;
  completed_date: string | null;
  grade: string | null;
  created_at: string | null;
  updated_at: string | null;
  writer_id?: string | null;
  user_id: string | null; // Updated to be nullable
  file_urls: string[] | null;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  user?: {
    full_name: string | null;
    email: string;
    phone_number?: string | null;
  } | null;
};

// Define writer type
export type Writer = {
  id: string;
  full_name: string | null;
  email: string;
};

export const useAssignments = () => {
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, userRole, userEmail, userId } = useAuth();

  const fetchAssignments = async () => {
    if (!isAuthenticated || !userId) {
      console.log('User not authenticated or userId not available');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching assignments for user ID:', userId);
      console.log('User role:', userRole);

      // For students - only show their own assignments
      if (userRole === 'student') {
        // Fetch active assignments
        const { data: active, error: activeError } = await supabase
          .from('assignments')
          .select('*')
          .eq('user_id', userId)
          .neq('status', 'completed')
          .order('due_date', { ascending: true });

        if (activeError) {
          console.error('Error fetching active assignments:', activeError);
          throw activeError;
        }
        
        console.log('Student active assignments fetched:', active?.length || 0);
        setActiveAssignments(active || []);

        // Fetch completed assignments
        const { data: completed, error: completedError } = await supabase
          .from('assignments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('completed_date', { ascending: false });

        if (completedError) {
          console.error('Error fetching completed assignments:', completedError);
          throw completedError;
        }
        
        console.log('Student completed assignments fetched:', completed?.length || 0);
        setCompletedAssignments(completed || []);
      }
      // For writers - enhanced query approach
      else if (userRole === 'writer') {
        console.log('Fetching assignments for writer with ID:', userId);
        
        // First, fetch all available assignments (status='submitted', writer_id=null)
        // Include user information with expanded fields
        const { data: availableAssignments, error: availableError } = await supabase
          .from('assignments')
          .select(`
            *,
            user:profiles(full_name, email, phone_number)
          `)
          .eq('status', 'submitted')
          .is('writer_id', null);
          
        if (availableError) {
          console.error('Error fetching available assignments:', availableError);
          throw availableError;
        }
        
        // Log the raw results to see what's coming back from DB
        console.log('Raw available assignments result:', availableAssignments);
        console.log('Available assignments count:', availableAssignments?.length || 0);
        
        // Get assignments assigned to this writer
        const { data: assignedToWriter, error: assignedError } = await supabase
          .from('assignments')
          .select(`
            *,
            user:profiles(full_name, email, phone_number)
          `)
          .eq('writer_id', userId)
          .neq('status', 'completed');
          
        if (assignedError) {
          console.error('Error fetching writer\'s assignments:', assignedError);
          throw assignedError;
        }
        
        console.log('Writer\'s assigned assignments found:', assignedToWriter?.length || 0);
        
        // Combine results
        const combinedActive = [
          ...(availableAssignments || []), 
          ...(assignedToWriter || [])
        ];
        
        console.log('Combined active assignments for writer:', combinedActive.length);
        setActiveAssignments(combinedActive);
        
        // Get completed assignments for this writer
        const { data: completed, error: completedError } = await supabase
          .from('assignments')
          .select(`
            *,
            user:profiles(full_name, email, phone_number)
          `)
          .eq('writer_id', userId)
          .eq('status', 'completed')
          .order('completed_date', { ascending: false });

        if (completedError) {
          console.error('Error fetching completed assignments:', completedError);
          throw completedError;
        }
        
        console.log('Writer completed assignments fetched:', completed?.length || 0);
        setCompletedAssignments(completed || []);
      }

    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to fetch assignments');
      toast.error('Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log('Authenticated user with ID, fetching assignments:', userId);
      fetchAssignments();
      
      // Set up real-time subscription for assignments with enhanced logging
      const assignmentsSubscription = supabase
        .channel('assignments-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'assignments' }, 
          (payload) => {
            console.log('Assignments change detected:', payload);
            fetchAssignments();
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return () => {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(assignmentsSubscription);
      };
    }
  }, [isAuthenticated, userId, userRole]);

  // Expose all the CRUD operations
  const createAssignment = async (assignmentData: {
    title: string;
    subject: string;
    description?: string | null;
    status?: string;
    progress?: number | null;
    due_date?: string | null;
    user_id?: string | null; // Updated to be nullable
    file_urls?: string[] | null;
    student_name?: string | null;
    student_email?: string | null;
    student_phone?: string | null;
  }) => {
    try {
      console.log('🔍 Creating assignment:', assignmentData.title);
      
      // Check if user is authenticated
      if (isAuthenticated && userId) {
        console.log('👤 Creating assignment as authenticated user:', userId);
        // Logged-in user flow - First, get the user's profile information
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, phone_number')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else {
          console.log('Found user profile:', userProfile?.email);
        }
        
        // Add student contact info to assignment data
        const enhancedAssignmentData = {
          ...assignmentData,
          user_id: userId,
          student_name: userProfile?.full_name || assignmentData.student_name,
          student_email: userProfile?.email || assignmentData.student_email,
          student_phone: userProfile?.phone_number || assignmentData.student_phone,
          status: assignmentData.status || 'submitted'
        };
        
        console.log('Enhanced assignment data:', enhancedAssignmentData);
        
        const { data, error } = await supabase
          .from('assignments')
          .insert([enhancedAssignmentData])
          .select();

        if (error) {
          console.error('❌ Error inserting assignment to DB:', error);
          throw error;
        }
        
        console.log('✅ Assignment created successfully:', data?.[0]?.id);
        
        // Send notification to writers about new assignment
        try {
          console.log('📧 Sending notification about new assignment');
          console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
          const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-message`;
          console.log('Notify URL:', notifyUrl);
          
          // Improved logging for notification payload
          const notificationPayload = {
            type: 'assignment_submitted',
            assignment: data[0]
          };
          console.log('Notification payload:', JSON.stringify(notificationPayload));
          
          const notifyResponse = await fetch(notifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(notificationPayload),
          });
          
          console.log('📤 Notification request sent to edge function');
          
          if (!notifyResponse.ok) {
            const responseText = await notifyResponse.text();
            console.error('❌ Notification API error:', notifyResponse.status, responseText);
          } else {
            const responseJson = await notifyResponse.json();
            console.log('✅ Notification sent successfully:', responseJson);
          }
        } catch (notifyError) {
          console.error('❌ Error sending assignment submission notification:', notifyError);
        }
        
        return data?.[0];
      } 
      else {
        console.log('👤 Creating assignment as anonymous user');
        // Anonymous user flow - Use our helper function
        try {
          const data = await submitAnonymousAssignment({
            ...assignmentData,
            status: assignmentData.status || 'submitted'
          });
          
          console.log('✅ Anonymous submission successful:', data?.[0]?.id);
          
          // Send notification to writers about new assignment
          try {
            console.log('📧 Sending notification about anonymous new assignment');
            console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
            const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-message`;
            console.log('Notify URL:', notifyUrl);
            
            const notifyResponse = await fetch(notifyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                type: 'assignment_submitted',
                assignment: data[0]
              }),
            });
            
            if (!notifyResponse.ok) {
              const responseText = await notifyResponse.text();
              console.error('❌ Notification API error:', notifyResponse.status, responseText);
            } else {
              const responseJson = await notifyResponse.json();
              console.log('✅ Anonymous assignment notification sent successfully:', responseJson);
            }
          } catch (notifyError) {
            console.error('❌ Error sending assignment submission notification:', notifyError);
          }
          
          return data[0];
        } catch (error) {
          console.error('❌ Error with anonymous submission:', error);
          throw error;
        }
      }
      
    } catch (err: any) {
      console.error('❌ Error creating assignment:', err);
      throw err;
    }
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // If the assignment is being taken by a writer, send a notification
      if (updates.writer_id && userRole === 'writer') {
        // Get the writer information
        const { data: writerData, error: writerError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', updates.writer_id)
          .single();
        
        if (!writerError && writerData) {
          // Send notification to the student
          try {
            // Use the full URL for the function call
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                type: 'assignment_taken',
                assignment: data[0],
                writer: writerData
              }),
            });
          } catch (notifyError) {
            console.error('Error sending assignment taken notification:', notifyError);
          }
        }
      }
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      throw err;
    }
  };

  const takeAssignment = async (assignmentId: string) => {
    if (!userId) {
      toast.error("You must be logged in to take an assignment");
      return null;
    }

    if (userRole !== 'writer') {
      toast.error("Only writers can take assignments");
      return null;
    }

    try {
      const updates = {
        writer_id: userId,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignmentId)
        .is('writer_id', null) // Only allow taking if no writer has taken it yet
        .select(`
          *,
          writer:profiles(id, full_name, email),
          user:profiles(id, full_name, email)
        `);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const assignment = data[0];
        const studentId = assignment.user_id;
        
        // Fix the TypeScript error by properly handling the writer object
        // The issue is that writer is being treated as an array when it should be an object
        const writer = assignment.writer as unknown as Writer;
        
        // Send initial message to student
        if (studentId && writer) {
          try {
            // Now this will work correctly since writer is properly typed
            const writerName = writer.full_name || writer.email;
            const message = `Hello! I'm ${writerName} and I've taken your assignment "${assignment.title}". I'll start working on it right away. Feel free to message me if you have any questions or additional information to share.`;
            
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                sender_id: userId,
                recipient_id: studentId,
                content: message,
                assignment_id: assignmentId,
                read: false
              });
              
            if (messageError) {
              console.error('Error sending initial message:', messageError);
            } else {
              console.log('Initial message sent successfully');
            }
          } catch (msgErr) {
            console.error('Error preparing initial message:', msgErr);
          }
        }
        
        // Notify student about assignment being taken
        try {
          // Use the full URL for the function call
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: 'assignment_taken',
              assignment: assignment,
              writer: writer
            }),
          });
        } catch (notifyError) {
          console.error('Error sending assignment taken notification:', notifyError);
        }
        
        toast.success("Assignment taken successfully");
        return assignment;
      } else {
        toast.error("This assignment has already been taken by another writer");
        return null;
      }
    } catch (err: any) {
      console.error('Error taking assignment:', err);
      toast.error(err.message || "Failed to take assignment");
      throw err;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return true;
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      throw err;
    }
  };

  return {
    activeAssignments,
    completedAssignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    takeAssignment,
    fetchAssignments
  };
};
