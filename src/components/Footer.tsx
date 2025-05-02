
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-500 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-2xl font-bold mb-4 block">
              CollegeAidCentral
            </Link>
            <p className="text-brand-100 mb-4">
              Helping college students succeed with their assignments and academic goals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-brand-200 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-brand-200 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-brand-200 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-brand-100 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-brand-100 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-brand-100 hover:text-white transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-brand-100 hover:text-white transition-colors">
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
                <a href="mailto:info@collegeaidcentral.com" className="text-brand-100 hover:text-white transition-colors">
                  info@collegeaidcentral.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+1234567890" className="text-brand-100 hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-400 mt-8 pt-8 text-center">
          <p className="text-brand-100">
            &copy; {currentYear} CollegeAidCentral. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
