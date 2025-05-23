
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Assignment } from '@/hooks/useAssignments';
import { useIsMobile } from '@/hooks/use-mobile';

const Checkout = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { isAuthenticated, userId } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) {
        toast.error('No assignment ID provided');
        navigate('/dashboard');
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          toast.error('Assignment not found');
          navigate('/dashboard');
          return;
        }

        // Check if this assignment belongs to the current user
        if (data.user_id !== userId) {
          toast.error('You do not have permission to access this assignment');
          navigate('/dashboard');
          return;
        }

        // Check if there is a price set
        if (data.price === null || data.price === undefined || data.price <= 0) {
          toast.error('This assignment does not have a price set for payment');
          navigate('/dashboard');
          return;
        }

        // Check if already paid
        if (data.paid) {
          toast.info('This assignment has already been paid for');
          navigate('/dashboard');
          return;
        }

        setAssignment(data);
      } catch (error) {
        console.error('Error fetching assignment:', error);
        toast.error('Failed to load assignment details');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchAssignment();
    } else {
      navigate('/login');
    }
  }, [assignmentId, isAuthenticated, navigate, userId]);

  const handlePayment = async () => {
    if (!assignment) return;
    
    setIsProcessing(true);
    try {
      // In a real implementation, this would integrate with a payment processor like Stripe
      // For now, we'll simulate a successful payment by updating the assignment status
      
      // Simulate a payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the assignment to mark it as paid
      const { error } = await supabase
        .from('assignments')
        .update({ paid: true })
        .eq('id', assignment.id);
        
      if (error) {
        throw error;
      }
      
      setIsSuccess(true);
      toast.success('Payment successful!');
      
      // Wait a moment before redirecting back to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">Assignment not found or you don't have permission to access it.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className={`flex-grow py-8 ${isMobile ? 'px-4' : 'px-8'}`}>
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Checkout
                {isSuccess && (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    Payment Complete
                  </span>
                )}
              </CardTitle>
              <CardDescription>Complete your payment for this assignment</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Assignment Details</h3>
                  <p className="font-medium text-lg">{assignment.title}</p>
                  <p className="text-gray-600">Subject: {assignment.subject}</p>
                  {assignment.description && (
                    <p className="text-gray-600 mt-2">{assignment.description}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="flex justify-between py-2">
                    <span>Assignment Fee</span>
                    <span>${assignment.price}</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between py-2 font-medium">
                    <span>Total</span>
                    <span>${assignment.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing || isSuccess}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Processing...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Paid Successfully
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${assignment.price}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
