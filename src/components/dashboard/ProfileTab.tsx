
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ProfileTab = () => {
  const { userId, userRole, userEmail } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolInstitution, setSchoolInstitution] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [gender, setGender] = useState('');
  const [writerBio, setWriterBio] = useState('');
  const [writerSkills, setWriterSkills] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (userId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setFullName(data.full_name || '');
          setPhone(data.phone_number || '');
          setSchoolInstitution(data.institution || '');
          setInstitutionType(data.institution_type || '');
          setGender(data.gender || '');
          setWriterBio(data.writer_bio || '');
          // Handle writer_skills that might be a string or string[]
          if (data.writer_skills) {
            if (Array.isArray(data.writer_skills)) {
              setWriterSkills(data.writer_skills.join(', '));
            } else {
              setWriterSkills(data.writer_skills);
            }
          }
          setAvatarUrl(data.avatar_url || null);
        }
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUpdating(true);
      
      if (!userId || !userEmail) {
        toast.error('User information not available');
        return;
      }
      
      // Convert writer skills to array if it's a string
      const skillsArray = writerSkills.split(',').map(skill => skill.trim()).filter(Boolean);
      
      const { error } = await supabase.from('profiles').update({
        id: userId,
        email: userEmail, // Required field from the error message
        full_name: fullName,
        phone_number: phone,
        institution: schoolInstitution,
        institution_type: institutionType,
        gender: gender,
        updated_at: new Date().toISOString(),
        ...(userRole === 'writer' && {
          writer_bio: writerBio,
          writer_skills: skillsArray
        })
      }).eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    handleAvatarChange(file);
  };

  const handleAvatarChange = async (file: File) => {
    try {
      setUploading(true);

      if (!userId) {
        toast.error('User ID not found. Please log in again.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar: ', error);
      toast.error(error.message || 'Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your profile information here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <Avatar className="w-32 h-32 relative">
            <AvatarImage src={avatarUrl || undefined} alt="Avatar" className="object-cover" />
            <AvatarFallback>{fullName ? fullName[0].toUpperCase() : 'U'}</AvatarFallback>
            <div className="absolute bottom-0 right-0 flex items-center justify-center bg-secondary rounded-full p-2 cursor-pointer hover:bg-secondary-foreground"
              onClick={() => document.getElementById('avatar-upload')?.click()}>
              <Edit className="w-4 h-4 text-muted-foreground" />
            </div>
          </Avatar>
          <Input
            type="file"
            id="avatar-upload"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolInstitution">School/Institution</Label>
          <Input
            id="schoolInstitution"
            placeholder="Enter your school/institution"
            value={schoolInstitution}
            onChange={(e) => setSchoolInstitution(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="institutionType">Institution Type</Label>
          <Select value={institutionType} onValueChange={setInstitutionType}>
            <SelectTrigger>
              <SelectValue placeholder="Select institution type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">High School</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="university">University</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {userRole === 'writer' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="writerBio">Writer Bio</Label>
              <Textarea
                id="writerBio"
                placeholder="Enter your writer bio"
                value={writerBio}
                onChange={(e) => setWriterBio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="writerSkills">Writer Skills</Label>
              <Input
                id="writerSkills"
                placeholder="Enter your writer skills (comma-separated)"
                value={writerSkills}
                onChange={(e) => setWriterSkills(e.target.value)}
              />
            </div>
          </>
        )}
      </CardContent>
      <div className="p-6 pt-0">
        <Button onClick={handleSubmit} disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </Card>
  );
};

export default ProfileTab;
