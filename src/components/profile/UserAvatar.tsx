import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  showUploadButton?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = "md", 
  showUploadButton = false,
  className = ""
}) => {
  const { userAvatar, userEmail, updateUserAvatar, userId } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Determine size class based on size prop
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-20 w-20"
  }[size];

  useEffect(() => {
    // This will check if we have an avatar from Google sign-in
    if (!userAvatar && userId) {
      const checkGoogleAvatar = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .single();
            
          if (error) {
            console.error("Error fetching avatar:", error);
            return;
          }
          
          if (data?.avatar_url) {
            updateUserAvatar(data.avatar_url);
          }
        } catch (err) {
          console.error("Failed to check for Google avatar:", err);
        }
      };
      
      checkGoogleAvatar();
    }
  }, [userId, userAvatar, updateUserAvatar]);

  const getInitials = () => {
    if (!userEmail) return "U";
    
    const parts = userEmail.split('@')[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return userEmail.substring(0, 2).toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setIsUploading(true);
      
      // Check if avatars bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarBucketExists) {
        await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB
        });
      }
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicURL?.publicUrl) {
        // Update user profile in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicURL.publicUrl })
          .eq('id', userId);
          
        if (updateError) {
          throw updateError;
        }
        
        // Update local state
        await updateUserAvatar(publicURL.publicUrl);
        
        toast("Your profile avatar has been updated successfully.");
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || "An error occurred during avatar upload.");
    } finally {
      setIsUploading(false);
      // Clear the input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Avatar className={sizeClass}>
        <AvatarImage src={userAvatar || undefined} alt="User avatar" />
        <AvatarFallback className="bg-primary/10 text-primary">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      {showUploadButton && (
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="relative"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Avatar
              </>
            )}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
