
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignupForm from '@/components/auth/SignupForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [referralInfo, setReferralInfo] = useState<{
    code: string;
    discount: number;
    referrerName: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const referralCode = searchParams.get('ref');
    if (referralCode) {
      fetchReferralInfo(referralCode);
    }
  }, [searchParams]);

  const fetchReferralInfo = async (code: string) => {
    try {
      // Get referral info
      const { data: referral, error } = await supabase
        .from('referrals')
        .select(`
          *,
          profiles!referrals_referrer_user_id_fkey(full_name, email)
        `)
        .eq('referral_code', code)
        .single();

      if (error || !referral) {
        console.error('Referral not found:', error);
        toast({
          title: "Invalid Referral",
          description: "This referral link is invalid or has expired.",
          variant: "destructive",
        });
        return;
      }

      setReferralInfo({
        code,
        discount: referral.reward_value || 10,
        referrerName: referral.profiles?.full_name || referral.profiles?.email || 'A friend'
      });

      toast({
        title: "Referral Applied!",
        description: `You'll get ${referral.reward_value || 10}% off your first assignment!`,
      });
    } catch (error) {
      console.error('Error fetching referral info:', error);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {referralInfo && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 text-lg">
                🎉 Special Referral Offer!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700">
                <strong>{referralInfo.referrerName}</strong> has invited you to Assignment Hub!
              </p>
              <p className="text-green-600 font-semibold mt-2">
                Get <span className="text-xl">{referralInfo.discount}% OFF</span> your first assignment!
              </p>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <SignupForm referralCode={referralInfo?.code} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
