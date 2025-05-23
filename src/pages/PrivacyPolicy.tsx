
import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Assignment Hub ✒️</title>
        <meta name="description" content="Privacy policy for Assignment Hub. Learn about how we collect, use, and protect your personal information." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <header>
          <Navbar />
        </header>
        <main className="flex-grow py-10 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
              <p className="mb-4">
                This Privacy Policy describes how Assignment Hub ("we," "us," or "our") collects, uses, and shares your personal information when you visit our website or use our services.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
              <p>
                When you visit our website, we may collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
              </p>
              <p className="mt-3">
                When you register for an account or submit an assignment, we collect personal information such as your name, email address, educational institution, and any content you provide related to your assignments.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-6 my-4 space-y-2">
                <li>To provide and maintain our service, including to monitor the usage of our service.</li>
                <li>To manage your account and provide you with customer support.</li>
                <li>To match you with appropriate academic writers.</li>
                <li>To communicate with you about service updates, offers, and promotions.</li>
                <li>To improve our website and services.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Sharing Your Personal Information</h2>
              <p>
                We share your information with our trusted third parties, including:
              </p>
              <ul className="list-disc pl-6 my-4 space-y-2">
                <li>Academic writers who work on your assignments (only the information necessary to complete the work).</li>
                <li>Service providers for web hosting, payment processing, and communication tools.</li>
                <li>Legal authorities when required by law or to protect our rights.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Data Retention</h2>
              <p>
                We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Your Rights</h2>
              <p>
                Depending on your location, you may have rights regarding your personal information, such as:
              </p>
              <ul className="list-disc pl-6 my-4 space-y-2">
                <li>The right to access the personal information we hold about you.</li>
                <li>The right to request correction or deletion of your personal information.</li>
                <li>The right to restrict or object to our processing of your personal information.</li>
                <li>The right to data portability.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@assignmenthub.org.
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

export default PrivacyPolicy;
