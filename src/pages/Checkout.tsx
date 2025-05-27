
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, DollarSign, Calendar, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Assignment } from '@/hooks/useAssignments';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const Checkout = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, userRole } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'student') {
      navigate('/login');
      return;
    }

    if (!assignmentId) {
      navigate('/dashboard');
      return;
    }

    // Check for payment success from URL params
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your assignment will be processed shortly.');
      navigate('/dashboard');
      return;
    }

    fetchAssignment();
  }, [assignmentId, isAuthenticated, userRole, searchParams]);

  const fetchAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;

      if (!data.price || data.paid) {
        toast.error('This assignment is not available for payment');
        navigate('/dashboard');
        return;
      }

      setAssignment(data);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment details');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!assignment) return;

    setIsProcessing(true);
    try {
      console.log('Creating Lemon Squeezy checkout for assignment:', assignment.id);

      // Create checkout session with Lemon Squeezy
      const { data, error } = await supabase.functions.invoke('create-lemon-squeezy-checkout', {
        body: {
          assignmentId: assignment.id,
          price: assignment.price,
          assignmentTitle: assignment.title,
          studentEmail: assignment.student_email
        }
      });

      if (error) {
        console.error('Error creating checkout:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.checkoutUrl) {
        throw new Error('No checkout URL received');
      }

      console.log('Redirecting to Lemon Squeezy checkout:', data.checkoutUrl);
      
      // Redirect to Lemon Squeezy checkout
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>Assignment not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-gray-600">Complete payment for your assignment</p>
          </div>

          <div className="space-y-6">
            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assignment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{assignment.title}</h3>
                  <p className="text-sm text-gray-600">{assignment.subject}</p>
                </div>
                
                {assignment.description && (
                  <div>
                    <label className="text-sm font-medium">Description:</label>
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  <Badge variant="outline">
                    {assignment.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Assignment Fee</span>
                    <span className="font-semibold">${assignment.price?.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total</span>
                      <span>${assignment.price?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Security Notice */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <span>Secure payment powered by Lemon Squeezy</span>
                </div>
                
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${assignment.price?.toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Your payment is secure and encrypted with Lemon Squeezy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
