
import React, { useState, useEffect } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  writer_bio: z.string().max(500, "Bio must be 500 characters or less"),
  writer_skills: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

const WriterProfileForm = () => {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      writer_bio: "",
      writer_skills: ""
    },
  });

  // Fetch existing writer profile data
  useEffect(() => {
    const fetchWriterProfile = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('profiles')
          .select('writer_bio, writer_skills')
          .eq('id', userId)
          .single();

        if (error) {
          console.error("Error fetching writer profile:", error);
          return;
        }

        // Format skills array back to comma-separated string
        const skillsString = data?.writer_skills ? data.writer_skills.join(', ') : '';

        form.reset({
          writer_bio: data?.writer_bio || '',
          writer_skills: skillsString
        });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWriterProfile();
  }, [userId, form]);

  const onSubmit = async (data: FormData) => {
    if (!userId) return;
    
    try {
      setIsSaving(true);

      // Convert comma-separated skills to array
      const skillsArray = data.writer_skills
        ? data.writer_skills.split(',').map(skill => skill.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from('profiles')
        .update({
          writer_bio: data.writer_bio,
          writer_skills: skillsArray
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Writer profile updated successfully");
    } catch (err: any) {
      console.error("Error updating writer profile:", err);
      toast.error("Failed to update profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="writer_bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Writer Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share information about your expertise and background..."
                  className="min-h-[120px]"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="writer_skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills (comma-separated)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Academic Writing, Research, Mathematics, English Literature..."
                  className="min-h-[80px]"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading || isSaving}>
          {isSaving ? "Saving..." : "Save Writer Profile"}
        </Button>
      </form>
    </Form>
  );
};

export default WriterProfileForm;
