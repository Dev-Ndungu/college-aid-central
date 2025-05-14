
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
        <title>The Assignment Hub - Expert Academic Writing Help for College & University</title>
        <meta name="description" content="Get professional academic writing assistance with essays, research papers, and assignments. 100% original content, affordable prices, 24/7 support." />
        <meta name="keywords" content="academic writing, essay help, research paper, dissertation, assignment help, college writing" />
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
