
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { UserPresence } from '@/integrations/supabase/client-with-types';

type PresenceData = {
  isOnline: boolean;
  lastSeen: string | null;
};

/**
 * Hook to manage user's online presence
 */
export const usePresence = (targetUserId?: string) => {
  const { userId, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine which user ID to track
  const userIdToTrack = targetUserId || userId;

  useEffect(() => {
    if (!userIdToTrack) return;

    // Fetch the current presence status
    const fetchPresenceStatus = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_presence')
          .select('online, last_seen')
          .eq('user_id', userIdToTrack)
          .single();
          
        if (error && error.code !== 'PGRST116') { // Not found error
          console.error('Error fetching user presence:', error);
          return;
        }
        
        if (data) {
          setIsOnline(data.online);
          setLastSeen(data.last_seen);
        }
      } catch (err) {
        console.error('Error in fetchPresenceStatus:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresenceStatus();

    // If this is the current user, update their presence
    if (isAuthenticated && userIdToTrack === userId) {
      // Function to update user presence status
      const updatePresence = async (online: boolean) => {
        try {
          const timestamp = new Date().toISOString();
          
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
      };
    } else {
      // For other users, set up a subscription to listen for changes
      const presenceSubscription = supabase
        .channel(`presence-${userIdToTrack}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'user_presence', filter: `user_id=eq.${userIdToTrack}` }, 
          (payload) => {
            if (payload.new) {
              setIsOnline(payload.new.online);
              setLastSeen(payload.new.last_seen);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(presenceSubscription);
      };
    }
  }, [userId, userIdToTrack, isAuthenticated, isOnline]);

  return { isOnline, lastSeen, loading };
};
