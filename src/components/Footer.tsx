
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0d2241] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/lovable-uploads/4e412f58-1db5-4ec0-82cc-c4d1adc3ee0c.png" 
                alt="Assignment Hub ✒️ Logo" 
                className="h-10 w-auto bg-white rounded-full p-1"
              />
              <span className="text-2xl font-bold">Assignment Hub ✒️</span>
            </Link>
            <p className="text-gray-200 mb-4">
              Helping college students succeed with their assignments and academic goals.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/assignmenthub" className="text-white hover:text-gray-300 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com/assignmenthub" className="text-white hover:text-gray-300 transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://www.instagram.com/assignmenthub" className="text-white hover:text-gray-300 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-200 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-200 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-gray-200 hover:text-white transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-200 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:info@assignmenthub.org" className="text-gray-200 hover:text-white transition-colors">
                  info@assignmenthub.org
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+1234567890" className="text-gray-200 hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            &copy; {currentYear} Assignment Hub ✒️. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
