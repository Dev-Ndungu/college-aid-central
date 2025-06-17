
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Referral = {
  id: string;
  referrer_user_id: string;
  invitee_user_id: string | null;
  invitee_email: string | null;
  referral_code: string | null;
  reward_status: string;
  reward_type: string | null;
  reward_value: number | null;
  assignment_id: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  email: string;
  full_name?: string | null;
};

type Assignment = {
  id: string;
  title: string;
};

type ReferralManagerProps = {
  open: boolean;
  onClose: () => void;
};

const ReferralManager: React.FC<ReferralManagerProps> = ({ open, onClose }) => {
  const { userId } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [inviteeProfiles, setInviteeProfiles] = useState<{ [id: string]: Profile }>({});
  const [assignments, setAssignments] = useState<{ [id: string]: Assignment }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fetchReferrals = async () => {
      let { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        setReferrals([]);
        setLoading(false);
        return;
      }
      setReferrals(data);

      // Fetch profiles for invitees
      const inviteeIds = data
        .map((r: Referral) => r.invitee_user_id)
        .filter((id: string | null) => !!id);
      if (inviteeIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles').select('id, email, full_name')
          .in('id', inviteeIds);
        if (profiles) {
          let mapping: { [id: string]: Profile } = {};
          profiles.forEach((p: Profile) => mapping[p.id] = p);
          setInviteeProfiles(mapping);
        }
      }
      // Fetch assignments if relevant
      const assignmentIds = data
        .map((r: Referral) => r.assignment_id)
        .filter((id: string | null) => !!id);
      if (assignmentIds.length > 0) {
        const { data: asn } = await supabase
          .from('assignments').select('id, title')
          .in('id', assignmentIds);
        if (asn) {
          let mapping: { [id: string]: Assignment } = {};
          asn.forEach((a: Assignment) => mapping[a.id] = a);
          setAssignments(mapping);
        }
      }
      setLoading(false);
    };
    fetchReferrals();
  }, [open, userId]);

  // Simple discount update
  const updateReward = async (referralId: string, newRewardValue: number) => {
    await supabase
      .from('referrals')
      .update({ reward_value: newRewardValue, reward_status: 'rewarded' })
      .eq('id', referralId);
    // Refresh
    setReferrals(referrals => referrals.map(r => r.id === referralId ? { ...r, reward_value: newRewardValue, reward_status: 'rewarded' } : r));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Referral Program Manager</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p className="mb-4 text-gray-500 text-sm">
            See who you referred, the status of their assignments, and manage your referral rewards and discounts.
          </p>
          {loading ? (
            <p>Loading referrals...</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invitee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Update Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        No referrals yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map(ref => (
                      <TableRow key={ref.id}>
                        <TableCell>
                          {ref.invitee_user_id && inviteeProfiles[ref.invitee_user_id]?.full_name
                            ? inviteeProfiles[ref.invitee_user_id].full_name
                            : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {ref.invitee_email ||
                            (ref.invitee_user_id && inviteeProfiles[ref.invitee_user_id]?.email) ||
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          {ref.assignment_id && assignments[ref.assignment_id]
                            ? assignments[ref.assignment_id].title
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {ref.reward_status}
                        </TableCell>
                        <TableCell>
                          {ref.reward_type === "discount"
                            ? (ref.reward_value || 0) + "%"
                            : ref.reward_type}
                        </TableCell>
                        <TableCell>
                          <input
                            type="number"
                            className="border rounded p-1 w-20 mr-1"
                            min={0}
                            max={100}
                            value={ref.reward_value ?? 0}
                            onChange={e =>
                              updateReward(ref.id, Number(e.target.value))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralManager;
