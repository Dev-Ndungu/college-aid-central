
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  userName?: string; // Add userName as an optional prop
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ userId, showLabel = true, size = 'md', userName }) => {
  const presence = usePresence(userId);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Extract isOnline and lastSeen from presence
  const isOnline = presence?.isOnline || false;
  const lastSeen = presence?.lastSeen || null;

  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId) return;
      
      // Use passed userName if available
      if (userName) {
        setName(userName);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .single();
          
        if (error) {
          throw error;
        }
        
        setName(data?.full_name || data?.email || 'Unknown User');
      } catch (error: any) {
        console.error('Error fetching user name:', error);
        toast.error(`Couldn't load user information: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserName();
  }, [userId, userName]);

  const getStatusDisplay = () => {
    if (loading) return 'Loading...';
    if (isOnline) return `${name || 'User'} is online`;
    
    if (lastSeen) {
      const lastActive = new Date(lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return `${name || 'User'} was just active`;
      if (diffInMinutes < 60) return `${name || 'User'} was active ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${name || 'User'} was active ${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${name || 'User'} was active ${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    return `${name || 'User'} is offline`;
  };

  const statusClass = isOnline ? 'bg-green-500' : 'bg-gray-400';
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={`rounded-full ${statusClass} ${sizeClasses[size]}`}></div>
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {getStatusDisplay()}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
