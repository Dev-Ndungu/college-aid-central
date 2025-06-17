import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Copy, Mail, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { userId, userRole } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [inviteeProfiles, setInviteeProfiles] = useState<{ [id: string]: Profile }>({});
  const [assignments, setAssignments] = useState<{ [id: string]: Assignment }>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fetchData = async () => {
      // Fetch current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setCurrentUserProfile(profile);
      }

      // Fetch referrals - only show referrals made by the current user
      let { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching referrals:', error);
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
    fetchData();
  }, [open, userId]);

  // Simple discount update
  const updateReward = async (referralId: string, newRewardValue: number) => {
    const { error } = await supabase
      .from('referrals')
      .update({ reward_value: newRewardValue, reward_status: 'rewarded' })
      .eq('id', referralId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update reward value.",
        variant: "destructive",
      });
      return;
    }

    setReferrals(referrals => referrals.map(r => 
      r.id === referralId 
        ? { ...r, reward_value: newRewardValue, reward_status: 'rewarded' } 
        : r
    ));
    
    toast({
      title: "Success",
      description: "Reward value updated successfully.",
    });
  };

  const generateReferralLink = async () => {
    setIsGeneratingLink(true);
    try {
      const referralCode = `REF_${userId}_${Date.now()}`;
      
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: userId,
          referral_code: referralCode,
          reward_type: 'discount',
          reward_value: 10,
          reward_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/signup?ref=${referralCode}`;
      setReferralLink(link);
      
      toast({
        title: "Referral link generated!",
        description: "You can now copy the link or send it via email.",
      });
    } catch (error) {
      console.error('Error generating referral link:', error);
      toast({
        title: "Error",
        description: "Failed to generate referral link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Referral link has been copied to your clipboard.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendReferralEmail = async () => {
    if (!inviteeEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if (!referralLink) {
      toast({
        title: "Error",
        description: "Please generate a referral link first.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // Get the referral code from the link
      const referralCode = referralLink.split('ref=')[1];
      
      // Create referral record with email
      const { error: dbError } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: userId,
          invitee_email: inviteeEmail,
          referral_code: referralCode,
          reward_type: 'discount',
          reward_value: 10,
          reward_status: 'pending'
        });

      if (dbError) throw dbError;

      // Send email via edge function
      const response = await fetch('/functions/v1/send-referral-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteeEmail,
          referrerName: currentUserProfile?.full_name || currentUserProfile?.email || 'A friend',
          referralLink,
          discountValue: 10
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: "Referral sent!",
        description: `Referral invitation has been sent to ${inviteeEmail}.`,
      });
      
      setInviteeEmail("");
      setShowAddReferral(false);
      setReferralLink("");
      
      // Refresh referrals list
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false });
      if (data) setReferrals(data);
      
    } catch (error) {
      console.error('Error sending referral email:', error);
      toast({
        title: "Error",
        description: "Failed to send referral email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleAddReferral = () => {
    setShowAddReferral(true);
    setReferralLink("");
    setInviteeEmail("");
    setLinkCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Referral Program Manager
            {userRole === 'student' && (
              <Button
                onClick={handleAddReferral}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Referral
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {showAddReferral && userRole === 'student' && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Create New Referral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email to send referral invitation"
                  value={inviteeEmail}
                  onChange={(e) => setInviteeEmail(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={generateReferralLink}
                  disabled={isGeneratingLink}
                  variant="outline"
                  className="gap-2"
                >
                  Generate Link
                </Button>
                
                {inviteeEmail && (
                  <Button
                    onClick={sendReferralEmail}
                    disabled={isSendingEmail}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {isSendingEmail ? "Sending..." : "Send Email"}
                  </Button>
                )}
              </div>

              {referralLink && (
                <div className="space-y-2">
                  <Label>Referral Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      onClick={copyReferralLink}
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      {linkCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddReferral(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-4">
          <p className="mb-4 text-gray-500 text-sm">
            {userRole === 'student' 
              ? "Manage your referrals and track the status of people you've invited."
              : "Manage referral rewards and discount values for all referrals."
            }
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
                    {userRole === 'writer' && <TableHead>Update Discount</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={userRole === 'writer' ? 6 : 5} className="text-center text-gray-500">
                        {userRole === 'student' 
                          ? "No referrals yet. Click \"Add Referral\" to get started!"
                          : "No referrals to manage yet."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map(ref => (
                      <TableRow key={ref.id}>
                        <TableCell>
                          {ref.invitee_user_id && inviteeProfiles[ref.invitee_user_id]?.full_name
                            ? inviteeProfiles[ref.invitee_user_id].full_name
                            : 'Pending'}
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
                          <span className={`px-2 py-1 rounded text-xs ${
                            ref.reward_status === 'rewarded' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ref.reward_status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {ref.reward_type === "discount"
                            ? (ref.reward_value || 0) + "%"
                            : ref.reward_type}
                        </TableCell>
                        {userRole === 'writer' && (
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
                        )}
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
