
import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Alex Johnson",
    university: "University of Michigan",
    text: "CollegeAidCentral helped me manage my overwhelming workload during finals week. The quality of work exceeded my expectations, and I was able to submit all my assignments on time.",
    stars: 5,
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Samantha Williams",
    university: "Boston College",
    text: "As a working student, I often struggle to balance my job and studies. This platform has been a lifesaver for me. The tutors are knowledgeable and responsive.",
    stars: 5,
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "Michael Chen",
    university: "UC Berkeley",
    text: "I was skeptical at first, but after receiving my first assignment back, I was impressed with the quality and attention to detail. Highly recommend for any student who needs academic support.",
    stars: 4,
    image: "https://randomuser.me/api/portraits/men/62.jpg"
  }
];

const Testimonials = () => {
  return (
    <section className="section bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-bold mb-4">What Students Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from students who have used our services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg p-6 shadow-md border border-gray-100 card-hover"
            >
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-5 w-5 ${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">{testimonial.university}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
