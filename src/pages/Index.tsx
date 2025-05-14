
import React from 'react';
import { Helmet } from 'react-helmet';
import Hero from '@/components/home/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import Features from '@/components/home/Features';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Assignment Hub ✒️ - Expert Academic Writing Help for College & University</title>
        <meta name="description" content="Get professional academic writing assistance with essays, research papers, and assignments. 100% original content, affordable prices, 24/7 support." />
        <meta name="keywords" content="academic writing, essay help, research paper, dissertation, assignment help, college writing" />
        <link rel="canonical" href="https://www.assignmenthub.org/" />
        <meta property="og:url" content="https://www.assignmenthub.org/" />
        <meta property="og:site_name" content="Assignment Hub" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Assignment Hub - Expert Academic Writing Help" />
        <meta property="og:description" content="Professional academic writing assistance for college and university students." />
      </Helmet>
      <div className="min-h-screen flex flex-col" itemScope itemType="https://schema.org/WebPage">
        <header>
          <Navbar />
        </header>
        <main className="flex-grow">
          <Hero />
          <HowItWorks />
          <Features />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
