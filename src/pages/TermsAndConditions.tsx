
import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TermsAndConditions = () => {
  return (
    <>
      <Helmet>
        <title>Terms and Conditions | Assignment Hub ✒️</title>
        <meta name="description" content="Terms and conditions for using Assignment Hub services. Read our agreement before submitting your assignment." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <header>
          <Navbar />
        </header>
        <main className="flex-grow py-10 px-4 md:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
              <p className="mb-4">
                Before submitting the order, please read these terms and conditions carefully. If you click "I accept," you'll be bound by this agreement's terms and conditions. You (the "Customer" or "client") are entering into a legally binding contract with Assignment Hub (the "Company") by agreeing to the terms and conditions set out above.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Offered services</h2>
              <p>
                Writing services ("Order" or "Project") are provided by the Company to the Customer and are uploaded to the Customer's account on the Company's website in either Microsoft Word, Powerpoint, Apple Mac OS Pages, Numbers, Keynotes and Excel format. The Project shall be delivered by the Company in accordance with the terms of the Order and within the Timeframe specified in the Order. With the customer's consent, the company may alter the delivery date.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Service Level Agreements</h2>
              <p>When we talk about "Order Requirements," we mean everything that was filled out on the order form when we placed the Order.</p>
              <ul className="list-disc pl-6 my-4 space-y-2">
                <li>Unless otherwise agreed with the Company, the Client has 3 hours after initiating an emergency Project (delivery in 2–48 hours) and 20 hours after initiating a non-emergency Project (delivery in more than 48 hours) to make any necessary changes or add any necessary project materials.</li>
                <li>If you send this data in before the deadline, we'll count it as part of your "Order Requirements".</li>
                <li>Unless otherwise agreed upon by the Parties, after the aforementioned period, the Company reserves the right to treat any updates or materials as "Additional requests" and include them in the Order details at its discretion.</li>
                <li>If fulfilling your request significantly increases the amount of work required, the firm may charge you extra.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Grades and Deliverables</h2>
              <p>
                Due to the inherently subjective nature of academic work, the Company cannot guarantee any particular letter grade for the Projects it delivers to the Customer. This is because the Customer's grade may be affected by factors outside of the Company's control, such as the Customer's overall performance during the term, the professor's attitude, required readings that were not provided by the Company, and the Customer's presentation of the Project.
              </p>
              <p className="mt-3">
                Therefore, the Customer agrees that they have read and completely understand the Order Requirements and understand that the Company's only responsibility is to provide a research project that satisfies those requirements and is completed on time.
              </p>
              <p className="mt-3">
                Customer understands and accepts that they are solely responsible for their final grades and for ensuring that the final, delivered Project fully satisfies their needs.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Submission Recommendations</h2>
              <p>
                The Company recommends that the Customer double-check the Project upon its arrival and get in touch right away if there are any issues or changes that need to be made.
              </p>
              <p className="mt-3">
                For this reason, the Company suggests that the Customer schedule a deadline for the Project that is at least 12 hours before the actual submission date.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">Payment Terms</h2>
              <p>
                The Customer will pay the "Order Fee" to the Company in accordance with the terms of the Order Form and the scope of the Project. The Order processing charge is due at the time an Order is created.
              </p>
              <p className="mt-3">
                Discounts, fees, and other adjustments are subject to negotiation between the customer and the company.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TermsAndConditions;
