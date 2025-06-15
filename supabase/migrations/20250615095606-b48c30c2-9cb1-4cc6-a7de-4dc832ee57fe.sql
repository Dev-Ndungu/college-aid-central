
-- 1. Create a referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES public.profiles(id),
  invitee_user_id uuid REFERENCES public.profiles(id),
  referral_code text,
  invitee_email text,
  reward_status text NOT NULL DEFAULT 'pending',
  reward_type text DEFAULT 'discount',
  reward_value numeric DEFAULT 0,
  assignment_id uuid REFERENCES public.assignments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable row-level security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 3. Allow referrers to select and update their own referral rows
CREATE POLICY "Referrers can view their own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Referrers can insert referrals for themselves"
  ON public.referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Referrers can update their own referrals"
  ON public.referrals
  FOR UPDATE
  USING (auth.uid() = referrer_user_id);

-- 4. Allow admin-wide access (optional, adjust if you have admin users)
-- (Uncomment if needed)
-- CREATE POLICY "Admins can see all referrals"
--   ON public.referrals
--   FOR ALL
--   USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

