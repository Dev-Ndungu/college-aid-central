
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['student', 'writer']),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phoneNumber: z.string().optional(),
  institution: z.string().optional(),
  institutionType: z.enum(['university', 'college', 'high_school', 'other']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  referralCode?: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ referralCode }) => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, {
        full_name: data.fullName,
        gender: data.gender,
        phone_number: data.phoneNumber,
        institution: data.institution,
        institution_type: data.institutionType,
        referral_code: referralCode,
      });

      // If there's a referral code, update the referral record
      if (referralCode) {
        // Get the newly created user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Update referral record with the new user
          await supabase
            .from('referrals')
            .update({ 
              invitee_user_id: user.id,
              invitee_email: data.email
            })
            .eq('referral_code', referralCode);
        }
      }

      toast.success(referralCode 
        ? "Welcome! Your referral discount has been applied to your account."
        : "Account created successfully! Please check your email to verify your account.");
      
      navigate('/profile-completion');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || "Error creating account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {referralCode && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <p className="text-green-700 text-sm">
            ✅ Referral code applied! You'll get a discount on your first assignment.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          {...register('fullName')}
          className={errors.fullName ? 'border-red-500' : ''}
        />
        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <Label>I am a</Label>
        <RadioGroup
          value={selectedRole}
          onValueChange={(value) => setValue('role', value as 'student' | 'writer')}
          className="flex flex-row space-x-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="student" id="student" />
            <Label htmlFor="student">Student</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="writer" id="writer" />
            <Label htmlFor="writer">Writer</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="gender">Gender (Optional)</Label>
        <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
        <Input
          id="phoneNumber"
          {...register('phoneNumber')}
        />
      </div>

      {selectedRole === 'student' && (
        <>
          <div>
            <Label htmlFor="institution">Institution (Optional)</Label>
            <Input
              id="institution"
              {...register('institution')}
              placeholder="e.g., Harvard University"
            />
          </div>

          <div>
            <Label htmlFor="institutionType">Institution Type (Optional)</Label>
            <Select onValueChange={(value) => setValue('institutionType', value as 'university' | 'college' | 'high_school' | 'other')}>
              <SelectTrigger>
                <SelectValue placeholder="Select institution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="high_school">High School</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <div className="text-center">
        <span className="text-sm text-gray-600">Already have an account? </span>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
};

export default SignupForm;
