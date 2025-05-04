
import React, { useState, useEffect } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, GraduationCap, Save, User } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  institutionType: z.enum(["university", "college"]),
  institution: z.string().min(2, "Please enter your institution name"),
  gender: z.enum(["male", "female", "other"]),
});

type FormData = z.infer<typeof formSchema>;

type ProfileData = {
  full_name: string | null;
  institution: string | null;
  institution_type: string | null;
  gender: string | null;
};

const ProfileTab = () => {
  const { isAuthenticated, userEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      institutionType: "university",
      institution: "",
      gender: "male",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !userEmail) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, institution, institution_type, gender')
          .eq('email', userEmail)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          // Don't throw the error, just log it and continue with default values
          return;
        }
        
        if (data) {
          // Convert null values to defaults
          form.reset({
            fullName: data.full_name || "",
            institutionType: (data.institution_type as "university" | "college") || "university",
            institution: data.institution || "",
            gender: (data.gender as "male" | "female" | "other") || "male",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
    
    // Set up real-time listener for profile updates
    const profileSubscription = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: `email=eq.${userEmail}` }, 
        (payload) => {
          const newData = payload.new as any;
          
          if (newData) {
            form.reset({
              fullName: newData.full_name || "",
              institutionType: (newData.institution_type as "university" | "college") || "university",
              institution: newData.institution || "",
              gender: (newData.gender as "male" | "female" | "other") || "male",
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [isAuthenticated, userEmail, form]);

  const onSubmit = async (data: FormData) => {
    if (!isAuthenticated || !userEmail) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          institution: data.institution,
          institution_type: data.institutionType,
          gender: data.gender,
        })
        .eq('email', userEmail);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "An error occurred while updating your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>
          View and update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        {...field} 
                        placeholder="Enter your full name"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="institutionType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Institution Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                      disabled={isLoading}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="university" id="profile-university" />
                        <FormLabel htmlFor="profile-university" className="cursor-pointer">
                          University
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="college" id="profile-college" />
                        <FormLabel htmlFor="profile-college" className="cursor-pointer">
                          College
                        </FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        {...field} 
                        placeholder="College/University name"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading || isSaving}>
              {isSaving ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
