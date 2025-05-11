
import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { UserPresence } from '@/integrations/supabase/client-with-types';

interface OnlineStatusProps {
  userId: string | null;
  userName: string | null;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ userId, userName }) => {
  const [userStatus, setUserStatus] = useState<UserPresence | null>(null);
  const { toast } = useToast();
  const displayName = userName || 'User';

  useEffect(() => {
    if (!userId) return;

    // Function to fetch user's last seen and online status
    const fetchUserStatus = async () => {
      try {
        // We have to use any here since the types don't include user_presence yet
        const { data, error } = await supabase
          .from('user_presence')
          .select('online, last_seen')
          .eq('user_id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching user status:', error);
          return;
        }
        
        if (data) {
          setUserStatus(data as UserPresence);
        }
      } catch (err) {
        console.error('Error in fetchUserStatus:', err);
      }
    };

    fetchUserStatus();
    
    // Subscribe to changes in user presence
    const presenceChannel = supabase
      .channel(`presence-${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_presence', filter: `user_id=eq.${userId}` }, 
        (payload) => {
          const newStatus = payload.new as UserPresence;
          setUserStatus(newStatus);
          
          // Show toast notification when user comes online
          if (newStatus.online && !userStatus?.online) {
            toast({
              title: `${displayName} is now online`,
              description: "They can respond to your messages in real-time.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userId, userName, toast, userStatus?.online]);

  if (!userStatus) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {userStatus.online ? (
        <>
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-green-600 dark:text-green-400">Online</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-gray-300"></span>
          <span className="text-xs text-gray-500">
            Last seen {formatDistanceToNow(new Date(userStatus.last_seen), { addSuffix: true })}
          </span>
        </>
      )}
    </div>
  );
};

export default OnlineStatus;
