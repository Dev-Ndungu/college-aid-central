
import React, { useState } from 'react';
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
  const { userAvatar, userEmail, updateUserAvatar } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Determine size class based on size prop
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-20 w-20"
  }[size];

  const getInitials = () => {
    return userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

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
        await updateUserAvatar(publicURL.publicUrl);
        toast({
          title: "Avatar updated",
          description: "Your profile avatar has been updated successfully.",
        });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "An error occurred during avatar upload.",
      });
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
