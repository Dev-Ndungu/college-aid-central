
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
        <meta name="description" content="Get professional academic writing assistance with essays, research papers, dissertations and assignments. 100% original content, affordable prices, 24/7 support from verified experts." />
        <meta name="keywords" content="academic writing, essay help, research paper, dissertation, assignment help, college writing, university essay help, homework help, essay writing service, thesis help, term paper help, coursework assistance, case study help, book report, lab report, research proposal, personal statement, admission essay, scholarship essay, online tutoring, student help, APA formatting, MLA formatting, Chicago style, Harvard referencing, plagiarism-free content, affordable writing service, professional writers, urgent assignment help, graduate level writing, undergraduate assignments" />
        <link rel="canonical" href="https://www.assignmenthub.org/" />
        
        {/* OpenGraph Meta Tags for better social sharing */}
        <meta property="og:url" content="https://www.assignmenthub.org/" />
        <meta property="og:site_name" content="Assignment Hub" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Assignment Hub - Expert Academic Writing Help" />
        <meta property="og:description" content="Professional academic writing assistance for college and university students. Get expert help with essays, research papers, dissertations, and any academic assignment." />
        <meta property="og:image" content="https://www.assignmenthub.org/og-image.jpg" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@assignmenthub" />
        <meta name="twitter:title" content="Assignment Hub - Professional Academic Writing Services" />
        <meta name="twitter:description" content="Get top-quality academic writing assistance from expert writers. Essays, research papers, dissertations, and more." />
        <meta name="twitter:image" content="https://www.assignmenthub.org/twitter-card.jpg" />
        
        {/* Additional SEO-enhancing meta tags */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="Assignment Hub" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />

        {/* Structured Data for Rich Results */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Assignment Hub",
            "url": "https://www.assignmenthub.org",
            "logo": "https://www.assignmenthub.org/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png",
            "sameAs": [
              "https://twitter.com/assignmenthub",
              "https://facebook.com/assignmenthub",
              "https://instagram.com/assignmenthub"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+1-123-456-7890",
              "contactType": "customer service",
              "availableLanguage": ["English"]
            }
          }
        `}</script>
        
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "https://www.assignmenthub.org/",
            "name": "Assignment Hub",
            "description": "Professional academic writing assistance for college and university students",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.assignmenthub.org/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        `}</script>
        
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does Assignment Hub work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Simply submit your assignment details, track the progress in real-time, receive your completed work before the deadline, and provide feedback if necessary."
                }
              },
              {
                "@type": "Question",
                "name": "Is Assignment Hub confidential?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Assignment Hub ensures 100% confidentiality. Your personal information is secured with our strict privacy policy."
                }
              },
              {
                "@type": "Question",
                "name": "What types of assignments can I get help with?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We provide assistance with essays, research papers, case studies, dissertations, theses, term papers, lab reports, book reviews, and virtually any type of academic writing across all subjects."
                }
              },
              {
                "@type": "Question",
                "name": "How quickly can I get my assignment completed?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We offer flexible deadlines, including urgent delivery options. Our writers can complete high-quality assignments in as little as 24 hours for short papers."
                }
              }
            ]
          }
        `}</script>
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
