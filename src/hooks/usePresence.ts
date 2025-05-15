
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { UserPresence } from '@/integrations/supabase/client-with-types';

/**
 * Hook to manage user's online presence
 */
export const usePresence = () => {
  const { userId, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Function to update user presence status
    const updatePresence = async (online: boolean) => {
      try {
        const timestamp = new Date().toISOString();
        
        // We can't use strongly typed query here since the types don't include user_presence yet
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            online: online,
            last_seen: timestamp
          }, {
            onConflict: 'user_id'
          });
          
        if (error) {
          console.error('Error updating user presence:', error);
        }
      } catch (err) {
        console.error('Error in updatePresence:', err);
      }
    };

    // Mark user as online on component mount
    updatePresence(true);
    setIsOnline(true);

    // Set up event listeners for visibility and offline/online status
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsOnline(isVisible);
      updatePresence(isVisible);
    };

    const handleOnline = () => {
      setIsOnline(true);
      updatePresence(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      updatePresence(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set an interval to update "last_seen" periodically when online
    const intervalId = setInterval(() => {
      if (isOnline) {
        updatePresence(true);
      }
    }, 60000); // Update every minute

    // Clean up event listeners and mark user as offline on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      
      // We don't mark the user as offline immediately on component unmount
      // because they might just be navigating to another page in the app
      // Instead, we rely on the visibilityChange event
    };
  }, [userId, isAuthenticated, isOnline]);

  return { isOnline };
};
