import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Hero from '@/components/home/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import Features from '@/components/home/Features';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import AnimatedCounter from "@/components/AnimatedCounter";

const Index = () => {
  const [assignmentDisplayFields, setAssignmentDisplayFields] = useState<{
    display_count: number;
    use_actual_count: boolean;
    initial_assignments_value: number;
    initial_students_value: number;
    initial_date: string;
  } | null>(null);

  useEffect(() => {
    const fetchDisplayFields = async () => {
      try {
        const { data: displaySettings, error: settingsError } = await supabase
          .from('assignment_display_count')
          .select('display_count, use_actual_count, initial_assignments_value, initial_students_value, initial_date')
          .single();

        if (settingsError) {
          console.error('Error fetching display settings:', settingsError);
          return;
        }
        setAssignmentDisplayFields(displaySettings);
      } catch (error) {
        console.error('An error occurred while fetching assignment count:', error);
      }
    };

    fetchDisplayFields();

    const assignmentsSubscription = supabase
      .channel('assignments-count-realtime-home')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assignments' },
        () => {
          fetchDisplayFields();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignment_display_count' },
        () => {
          fetchDisplayFields();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsSubscription);
    };
  }, []);

  // Helper to deterministically generate a pseudo-random number between min and max
  function pseudoRandom(seed: string, day: number, min: number, max: number) {
    let h = 2166136261 ^ (seed.charCodeAt(0) || 0);
    h ^= day;
    h = Math.imul(h ^ h >>> 17, 105903 ^ day);
    h = Math.imul(h ^ h >>> 11, 86813 ^ day);
    h ^= h >>> 15;
    return min + (Math.abs(h) % (max - min + 1));
  }

  // Helper to get days since initial_date
  const getDaysSince = (dateString: string | null) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  let assignmentCount = null;
  let studentsCount = null;
  if (assignmentDisplayFields) {
    const days = getDaysSince(assignmentDisplayFields.initial_date);

    // Calculate pseudo-random assignment increments for each day (5–15)
    let assignmentSum = 0;
    for (let i = 0; i < days; i++) {
      assignmentSum += pseudoRandom(assignmentDisplayFields.initial_date, i, 5, 15);
    }
    assignmentCount = (assignmentDisplayFields.initial_assignments_value || 0) + assignmentSum;

    // Calculate pseudo-random student increments for each day (4–8)
    let studentsSum = 0;
    for (let i = 0; i < days; i++) {
      studentsSum += pseudoRandom(assignmentDisplayFields.initial_date, i + 777, 4, 8); // day+777 keeps a different trajectory
    }
    studentsCount = (assignmentDisplayFields.initial_students_value || 0) + studentsSum;
  }

  return (
    <>
      <Helmet>
        <title>Assignment Hub ✒️ - Expert Academic Writing Help for College & University</title>
        <meta name="description" content="Get professional academic writing assistance with essays, research papers, dissertations and assignments. 100% original content, affordable prices, 24/7 support from verified experts." />
        <meta name="keywords" content="academic writing, essay help, research paper, dissertation, assignment help, college writing, university essay help, homework help, essay writing service, thesis help, term paper help, coursework assistance, case study help, book report, lab report, research proposal, personal statement, admission essay, scholarship essay, online tutoring, student help, APA formatting, MLA formatting, Chicago style, Harvard referencing, plagiarism-free content, affordable writing service, professional writers, urgent assignment help, graduate level writing, undergraduate assignments, history essay, literature review, business report, nursing assignment, psychology paper, computer science project, mathematics homework, economics assignment, biology lab report, chemistry report, physics assignment, engineering project, law essay, sociology paper, political science essay, philosophy essay, religious studies, art history paper, film analysis" />
        <link rel="canonical" href="https://www.assignmenthub.org/" />
        
        {/* OpenGraph Meta Tags for better social sharing */}
        <meta property="og:url" content="https://www.assignmenthub.org/" />
        <meta property="og:site_name" content="Assignment Hub" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Assignment Hub - Expert Academic Writing Help" />
        <meta property="og:description" content="Professional academic writing assistance for college and university students. Get expert help with essays, research papers, dissertations, and any academic assignment." />
        <meta property="og:image" content="https://www.assignmenthub.org/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@assignmenthub" />
        <meta name="twitter:title" content="Assignment Hub - Professional Academic Writing Services" />
        <meta name="twitter:description" content="Get top-quality academic writing assistance from expert writers. Essays, research papers, dissertations, and more." />
        <meta name="twitter:image" content="https://www.assignmenthub.org/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png" />
        
        {/* Additional SEO-enhancing meta tags */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="Assignment Hub" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="3 days" />
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
          
          {/* Trust-building assignment count */}
          {assignmentCount !== null && (
            <section className="py-8 bg-green-50">
              <div className="container mx-auto px-4">
                <Card className="bg-green-100 border-green-200 max-w-4xl mx-auto">
                  <CardContent className="p-6 text-center">
                    <p className="text-xl md:text-2xl font-bold text-green-800">
                      🎓 Join{" "}
                      <AnimatedCounter
                        value={studentsCount ?? 0}
                        className="text-green-900"
                        suffix="+"
                      />{" "}
                      Students Who Trust Assignment Hub
                    </p>
                    <p className="text-green-700 mt-2">
                      Assignments completed successfully with our expert writers
                    </p>
                    <div className="mt-2 text-green-900 font-semibold text-2xl">
                      🏆 Over{" "}
                      <AnimatedCounter
                        value={assignmentCount ?? 0}
                        className="text-green-900"
                      />{" "}
                      assignments submitted by students like you!
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}
          
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
