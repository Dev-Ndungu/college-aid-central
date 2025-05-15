import React, { useState, useEffect } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from '@/components/profile/UserAvatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Building, GraduationCap, Mail, Save, User, Phone, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchemaStudent = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  institutionType: z.enum(["university", "college"]),
  institution: z.string().min(2, "Please enter your institution name"),
  gender: z.enum(["male", "female", "other"]),
  phoneNumber: z.string().optional(),
});

const formSchemaWriter = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  gender: z.enum(["male", "female", "other"]),
  phoneNumber: z.string().optional(),
});

type FormDataStudent = z.infer<typeof formSchemaStudent>;
type FormDataWriter = z.infer<typeof formSchemaWriter>;

type ProfileData = {
  full_name: string | null;
  institution: string | null;
  institution_type: string | null;
  gender: string | null;
  phone_number: string | null;
  avatar_url: string | null;
};

const ProfileTab = () => {
  const { isAuthenticated, userEmail, userRole, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const studentForm = useForm<FormDataStudent>({
    resolver: zodResolver(formSchemaStudent),
    defaultValues: {
      fullName: "",
      institutionType: "university",
      institution: "",
      gender: "male",
      phoneNumber: "",
    },
  });

  const writerForm = useForm<FormDataWriter>({
    resolver: zodResolver(formSchemaWriter),
    defaultValues: {
      fullName: "",
      gender: "male",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !userEmail) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, institution, institution_type, gender, phone_number, avatar_url')
          .eq('email', userEmail)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        
        // Only proceed with setting form values if we have valid data
        if (data && typeof data === 'object' && !('error' in data)) {
          const profileData = data as ProfileData;
          
          if (userRole === 'student') {
            studentForm.reset({
              fullName: profileData.full_name ?? "",
              institutionType: ((profileData.institution_type as "university" | "college") ?? "university"),
              institution: profileData.institution ?? "",
              gender: ((profileData.gender as "male" | "female" | "other") ?? "male"),
              phoneNumber: profileData.phone_number ?? "",
            });
          } else {
            writerForm.reset({
              fullName: profileData.full_name ?? "",
              gender: ((profileData.gender as "male" | "female" | "other") ?? "male"),
              phoneNumber: profileData.phone_number ?? "",
            });
          }
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
          
          if (newData && typeof newData === 'object' && 'full_name' in newData) {
            const profileData = newData as ProfileData;
            
            if (userRole === 'student') {
              studentForm.reset({
                fullName: profileData.full_name ?? "",
                institutionType: ((profileData.institution_type as "university" | "college") ?? "university"),
                institution: profileData.institution ?? "",
                gender: ((profileData.gender as "male" | "female" | "other") ?? "male"),
                phoneNumber: profileData.phone_number ?? "",
              });
            } else {
              writerForm.reset({
                fullName: profileData.full_name ?? "",
                gender: ((profileData.gender as "male" | "female" | "other") ?? "male"),
                phoneNumber: profileData.phone_number ?? "",
              });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [isAuthenticated, userEmail, userRole, studentForm, writerForm]);

  const onSubmitStudent = async (data: FormDataStudent) => {
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
          phone_number: data.phoneNumber || null,
        })
        .eq('email', userEmail);

      if (error) {
        throw error;
      }

      toast.success("Your profile has been updated successfully.");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "An error occurred while updating your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitWriter = async (data: FormDataWriter) => {
    if (!isAuthenticated || !userEmail) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          gender: data.gender,
          phone_number: data.phoneNumber || null,
          // For writers, clear out the institution fields
          institution: null,
          institution_type: null,
        })
        .eq('email', userEmail);

      if (error) {
        throw error;
      }

      toast.success("Your profile has been updated successfully.");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "An error occurred while updating your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProfile = async () => {
    if (!isAuthenticated || !userEmail) return;
    
    try {
      setIsDeleting(true);
      
      // First delete the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', userEmail);

      if (profileError) {
        throw profileError;
      }
      
      // Then sign out
      await signOut();
      
      toast.success("Your account and profile have been deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      toast.error(error.message || "An error occurred while deleting your profile.");
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>My Profile</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={deleteProfile}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardTitle>
        <CardDescription>
          View and update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-8">
          <UserAvatar size="lg" showUploadButton={true} />
          <p className="text-sm text-muted-foreground mt-2">
            Click to upload or change your profile picture
          </p>
          {userEmail && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Mail className="h-4 w-4 mr-1" />
              <span>{userEmail}</span>
            </div>
          )}
        </div>
      
        {userRole === 'student' ? (
          <Form {...studentForm}>
            <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className="space-y-6">
              <FormField
                control={studentForm.control}
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
                control={studentForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          placeholder="Enter your phone number"
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
                control={studentForm.control}
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
                control={studentForm.control}
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
                control={studentForm.control}
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
        ) : (
          <Form {...writerForm}>
            <form onSubmit={writerForm.handleSubmit(onSubmitWriter)} className="space-y-6">
              <FormField
                control={writerForm.control}
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
                control={writerForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          placeholder="Enter your phone number"
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
                control={writerForm.control}
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
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
