
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Assignment } from '@/types/assignment';
import { createAssignmentSchema, updateAssignmentSchema, CreateAssignmentInput, UpdateAssignmentInput } from '@/schemas/assignment';
import { sanitizeText, sanitizeHtml } from '@/utils/sanitize';
import { toast } from 'sonner';

export const useSecureAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, userRole, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments();
    }
  }, [userId, userRole, isAuthenticated]);

  const fetchAssignments = async () => {
    if (!isAuthenticated) {
      setAssignments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          subject,
          assignment_type,
          due_date,
          price,
          status,
          progress,
          grade,
          created_at,
          updated_at,
          student_name,
          student_email,
          student_phone,
          file_urls,
          paid,
          payment_date,
          is_verified_account
        `);

      // Apply role-based filtering (RLS will handle the rest)
      if (userRole === 'student') {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignments:', error);
        toast.error('Failed to fetch assignments');
        return;
      }

      // Sanitize data before setting state
      const sanitizedData = data?.map(assignment => ({
        ...assignment,
        title: sanitizeText(assignment.title || ''),
        description: assignment.description ? sanitizeHtml(assignment.description) : null,
        subject: sanitizeText(assignment.subject || ''),
        student_name: assignment.student_name ? sanitizeText(assignment.student_name) : null
      })) || [];

      setAssignments(sanitizedData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('An error occurred while fetching assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (data: CreateAssignmentInput) => {
    if (!isAuthenticated || !userId) {
      toast.error('You must be logged in to create assignments');
      return null;
    }

    try {
      // Validate input
      const validatedData = createAssignmentSchema.parse(data);

      // Sanitize text fields
      const sanitizedData = {
        ...validatedData,
        title: sanitizeText(validatedData.title),
        description: validatedData.description ? sanitizeHtml(validatedData.description) : null,
        subject: sanitizeText(validatedData.subject),
        student_name: validatedData.student_name ? sanitizeText(validatedData.student_name) : null,
        user_id: userId
      };

      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
        toast.error('Failed to create assignment');
        return null;
      }

      toast.success('Assignment created successfully');
      await fetchAssignments(); // Refresh the list
      return newAssignment;
    } catch (error: any) {
      console.error('Validation or creation error:', error);
      if (error.errors) {
        // Zod validation errors
        const firstError = error.errors[0];
        toast.error(`Validation error: ${firstError.message}`);
      } else {
        toast.error('Failed to create assignment');
      }
      return null;
    }
  };

  const updateAssignment = async (data: UpdateAssignmentInput) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to update assignments');
      return null;
    }

    try {
      // Validate input
      const validatedData = updateAssignmentSchema.parse(data);
      const { id, ...updateFields } = validatedData;

      // Sanitize text fields
      const sanitizedData = {
        ...updateFields,
        title: updateFields.title ? sanitizeText(updateFields.title) : undefined,
        description: updateFields.description ? sanitizeHtml(updateFields.description) : undefined,
        subject: updateFields.subject ? sanitizeText(updateFields.subject) : undefined,
        student_name: updateFields.student_name ? sanitizeText(updateFields.student_name) : undefined,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key as keyof typeof sanitizedData] === undefined) {
          delete sanitizedData[key as keyof typeof sanitizedData];
        }
      });

      const { data: updatedAssignment, error } = await supabase
        .from('assignments')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating assignment:', error);
        toast.error('Failed to update assignment');
        return null;
      }

      toast.success('Assignment updated successfully');
      await fetchAssignments(); // Refresh the list
      return updatedAssignment;
    } catch (error: any) {
      console.error('Validation or update error:', error);
      if (error.errors) {
        // Zod validation errors
        const firstError = error.errors[0];
        toast.error(`Validation error: ${firstError.message}`);
      } else {
        toast.error('Failed to update assignment');
      }
      return null;
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to delete assignments');
      return false;
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        console.error('Error deleting assignment:', error);
        toast.error('Failed to delete assignment');
        return false;
      }

      toast.success('Assignment deleted successfully');
      await fetchAssignments(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('An error occurred while deleting the assignment');
      return false;
    }
  };

  return {
    assignments,
    isLoading,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
