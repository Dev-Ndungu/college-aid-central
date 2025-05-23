
import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RefundPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Refund Policy | Assignment Hub ✒️</title>
        <meta name="description" content="Refund policy for Assignment Hub services. Learn about our refund conditions and process." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <header>
          <Navbar />
        </header>
        <main className="flex-grow py-10 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
              <p className="mb-4">
                We want you to be completely satisfied with the services you receive from Assignment Hub. This refund policy outlines when and how you can request a refund for your order.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Eligibility for Refunds</h2>
              <p>
                You may be eligible for a full or partial refund in the following circumstances:
              </p>
              <ul className="list-disc pl-6 my-4 space-y-2">
                <li><strong>Quality Issues:</strong> If the completed assignment does not meet the quality standards specified in the order requirements, you may request a refund after providing specific feedback and allowing for revisions.</li>
                <li><strong>Late Delivery:</strong> If your assignment is delivered after the agreed-upon deadline and this delay has caused significant inconvenience or academic consequences.</li>
                <li><strong>Duplicate Payment:</strong> If you accidentally paid for the same order twice, we will refund the duplicate payment promptly.</li>
                <li><strong>Cancellation:</strong> If you cancel your order before a writer has been assigned, you are eligible for a full refund. If a writer has already begun working on your assignment, a partial refund may be issued based on the work completed.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Refund Process</h2>
              <p>
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal pl-6 my-4 space-y-2">
                <li>Contact our customer support team within 7 days of receiving the completed assignment.</li>
                <li>Provide your order number and a detailed explanation of why you're requesting a refund.</li>
                <li>Submit any supporting documentation that may be relevant to your refund request.</li>
                <li>Our team will review your request within 3-5 business days and communicate our decision.</li>
                <li>If approved, refunds will be processed back to the original payment method within 5-10 business days.</li>
              </ol>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Non-Refundable Circumstances</h2>
              <p>
                Refunds may not be issued in the following situations:
              </p>
              <ul className="list-disc pl-6 my-4 space-y-2">
                <li>If you've already approved and accepted the completed assignment.</li>
                <li>If your refund request is made more than 14 days after delivery.</li>
                <li>If you provided incorrect or incomplete information in your order requirements.</li>
                <li>If you claim plagiarism but our investigation confirms the work is original.</li>
                <li>If you've repeatedly requested revisions that contradict your original instructions.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Partial Refunds</h2>
              <p>
                In some cases, we may offer partial refunds based on:
              </p>
              <ul className="list-disc pl-6 my-4 space-y-2">
                <li>The extent to which the delivered work met your requirements.</li>
                <li>The amount of work already completed at the time of cancellation.</li>
                <li>The specific nature of the quality issues identified.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
              <p>
                If you have any questions about our refund policy, please contact our customer support team at refunds@assignmenthub.org.
              </p>
              
              <p className="mt-6">Last Updated: May 23, 2025</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default RefundPolicy;
