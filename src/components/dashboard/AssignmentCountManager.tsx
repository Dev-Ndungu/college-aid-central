
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const AssignmentCountManager = () => {
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [useActualCount, setUseActualCount] = useState<boolean>(true);
  const [actualCount, setActualCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCurrentSettings();
    fetchActualCount();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_display_count')
        .select('display_count, use_actual_count')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      setDisplayCount(data.display_count);
      setUseActualCount(data.use_actual_count);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchActualCount = async () => {
    try {
      const { count, error } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching actual count:', error);
        return;
      }

      setActualCount(count);
    } catch (error) {
      console.error('Error fetching actual count:', error);
    }
  };

  const updateSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('assignment_display_count')
        .update({
          display_count: displayCount,
          use_actual_count: useActualCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('assignment_display_count').select('id').single()).data?.id);

      if (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to update settings');
        return;
      }

      toast.success('Assignment count settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Assignment Count Display Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Current Settings</Label>
          <p className="text-sm text-gray-600">
            Currently showing: {useActualCount ? `${actualCount} (actual count)` : `${displayCount} (custom count)`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="use-actual-count"
            checked={useActualCount}
            onCheckedChange={setUseActualCount}
          />
          <Label htmlFor="use-actual-count">
            Use actual database count ({actualCount} assignments)
          </Label>
        </div>

        {!useActualCount && (
          <div className="space-y-2">
            <Label htmlFor="custom-count">Custom Display Count</Label>
            <Input
              id="custom-count"
              type="number"
              value={displayCount}
              onChange={(e) => setDisplayCount(Number(e.target.value))}
              placeholder="Enter custom count"
              min="0"
            />
            <p className="text-xs text-gray-500">
              This number will be displayed instead of the actual database count
            </p>
          </div>
        )}

        <Button 
          onClick={updateSettings} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Updating...' : 'Update Display Settings'}
        </Button>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">How it works:</h4>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• <strong>Actual Count:</strong> Shows the real number of assignments in the database</li>
            <li>• <strong>Custom Count:</strong> Shows a number you set manually</li>
            <li>• The count updates in real-time on both the home page and dashboard</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentCountManager;
