
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, DollarSign, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Assignment } from '@/hooks/useAssignments';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const Checkout = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
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

    fetchAssignment();
  }, [assignmentId, isAuthenticated, userRole]);

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
      // Here you would integrate with Stripe or another payment processor
      // For now, we'll simulate a successful payment
      
      // Update the assignment as paid
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          paid: true,
          payment_date: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (updateError) throw updateError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          assignment_id: assignment.id,
          student_id: assignment.user_id,
          writer_id: assignment.writer_id,
          amount: assignment.price,
          status: 'completed',
          payment_method: 'stripe' // This would come from actual payment integration
        });

      if (paymentError) throw paymentError;

      toast.success('Payment successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
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

            {/* Payment Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${assignment.price?.toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Your payment is secure and encrypted
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
