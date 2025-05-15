
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit, Upload } from 'lucide-react';

interface UserAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ className, size = 'lg' }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { userId, userEmail } = useAuth();
  const [userData, setUserData] = useState<{
    email?: string;
    avatar_url?: string;
  } | null>(null);

  // Fetch user data from profiles table
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email, avatar_url')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        setUserData(data);
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else {
          downloadAvatar();
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserData();
  }, [userId]);

  const downloadAvatar = async () => {
    try {
      if (!userId) {
        console.warn('No user ID found.');
        return;
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .download(`avatars/${userId}`);

      if (error) {
        // Check if the error is because the file doesn't exist
        if (error.message.includes('Object not found')) {
          console.log('Avatar not found, using default.');
          return; // No avatar found, use default
        } else {
          console.error('Error downloading avatar:', error);
          toast.error(`Couldn't load avatar: ${error.message}`);
          return;
        }
      }

      if (data) {
        const url = URL.createObjectURL(data);
        setAvatarUrl(url);
      }
    } catch (error: any) {
      console.error('Unexpected error downloading avatar:', error);
      toast.error(`Unexpected error loading avatar: ${error.message}`);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) {
      return;
    }

    const file = event.target.files[0];

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size should be less than 3MB');
      return;
    }

    setUploading(true);

    try {
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        toast.error(`Failed to upload avatar: ${uploadError.message}`);
        return;
      }

      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;

      // Update user metadata with the avatar URL
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        toast.error(`Failed to update profile: ${metadataError.message}`);
      } else {
        // Optimistically update the local state
        setAvatarUrl(publicUrl);
        toast.success('Avatar updated successfully!');
      }
    } catch (error: any) {
      console.error('Unexpected error uploading avatar:', error);
      toast.error(`Unexpected error uploading avatar: ${error.message}`);
    } finally {
      setUploading(false);
      // Clear the input
      const input = event.target as HTMLInputElement;
      input.value = '';
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleAvatarUpload(event);
  };
  
  // Set avatar size based on prop
  const avatarSizeClass = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-12 w-12' : 'h-32 w-32';
  const shouldShowUpload = size === 'lg'; // Only show upload UI for large avatars

  return (
    <div className={`flex flex-col items-center ${shouldShowUpload ? 'space-y-4' : ''} ${className}`}>
      <Avatar className={avatarSizeClass}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" />
        ) : (
          <AvatarFallback>
            {userData?.email ? userData.email[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : 'N/A'}
          </AvatarFallback>
        )}
      </Avatar>
      {shouldShowUpload && (
        <div className="space-y-2 text-center">
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <Button asChild variant="secondary" disabled={uploading}>
              <label htmlFor="avatar-upload" className="cursor-pointer">
                {uploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Change Avatar
                  </>
                )}
              </label>
            </Button>
          </Label>
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground">
            Click to upload a new avatar (Max 3MB)
          </p>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
