
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Phone } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Hero = () => {
  const whatsappNumber = "0797280930";
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  
  // Academic-themed images for the carousel
  const carouselImages = [
    {
      src: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      alt: "Person writing in a notebook",
    },
    {
      src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      alt: "Student studying at library",
    },
    {
      src: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      alt: "Studying with textbooks and laptop",
    },
    {
      src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      alt: "Taking notes during research",
    },
    {
      src: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      alt: "Student working on assignment",
    },
    {
      src: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      alt: "Books and writing materials",
    },
  ];
  
  // Auto-rotate carousel slides
  const [api, setApi] = useState<any>(null);
  
  const onSelect = useCallback(() => {
    if (!api) return;
  }, [api]);
  
  // Auto-rotation effect for the carousel
  useEffect(() => {
    if (!api) return;
    
    // Set up the onSelect event to track the selected slide
    api.on("select", onSelect);
    
    // Auto-rotate slides every 3 seconds
    const autoplayInterval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    
    // Cleanup function to remove event listeners and clear interval
    return () => {
      api.off("select", onSelect);
      clearInterval(autoplayInterval);
    };
  }, [api, onSelect]);
  
  return (
    <section className="hero bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="animate-fade-in">
            <h1 className="font-bold mb-4">
              Expert Help for Your <span className="gradient-text">Academic Writing</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Get professional assistance with your assignments, track your progress, and access valuable educational resources to improve your grades and reduce stress.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-[#0d2241] hover:bg-[#193764]" size="lg" asChild>
                <Link to="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-[#0d2241] text-[#0d2241] hover:bg-[#0d2241]/10" asChild>
                <Link to="/how-it-works">How It Works</Link>
              </Button>
              <Button size="lg" variant="secondary" className="bg-green-600 hover:bg-green-700 text-white" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-4 w-4" /> Get in Touch
                </a>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">Professional guidance from expert writers</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">24/7 support for urgent assignments</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">100% original content</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-[#0d2241] h-5 w-5 mt-1 flex-shrink-0" />
                <p className="text-gray-600">Secure and confidential service</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <Carousel
                setApi={setApi}
                className="w-full max-w-md mx-auto"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent>
                  {carouselImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative">
                        <img 
                          src={image.src} 
                          alt={image.alt} 
                          className="rounded-lg shadow-lg w-full aspect-[4/3] object-cover animate-fade-in"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 rounded-b-lg">
                          <p className="text-sm font-medium">{image.alt}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 bg-white/80 hover:bg-white" />
                <CarouselNext className="right-2 bg-white/80 hover:bg-white" />
              </Carousel>
              
              <img 
                src="/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png"
                alt="The Writers Hub Logo"
                className="absolute -bottom-6 -right-6 w-24 h-24 bg-white rounded-full p-2 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
