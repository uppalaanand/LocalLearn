import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Linkedin, Github, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socialLinks } from '../config/social';
import { useRole } from '../context/RoleContext';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const { role } = useRole();

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 md:pb-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & Quote */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <MapPin className="h-7 w-7" />
              LocalLearn
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed whitespace-normal break-words">
              Connecting students with the best local teachers. Empowering communities through accessible education.
            </p>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative">
              <span className="text-4xl text-indigo-200 absolute -top-2 left-2 leading-none font-serif">"</span>
              <p className="text-indigo-800 font-medium text-sm italic relative z-10 pt-2">
                Education is the bridge between dreams and reality.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-gray-300"></span> Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-gray-300"></span> Explore Classes
                </Link>
              </li>
              <li>
                <Link to="/teachers" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-gray-300"></span> Browse Teachers
                </Link>
              </li>
              {isAuthenticated && role === 'student' && (
                <li>
                  <Link to="/student" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-gray-300"></span> My Dashboard
                  </Link>
                </li>
              )}
              {isAuthenticated && role === 'teacher' && (
                <li>
                  <Link to="/teacher" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-gray-300"></span> Teacher Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <a href="mailto:locallearn@gmail.com" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                  locallearn@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <a href="tel:+919876543210" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <span className="text-gray-500 text-sm font-medium">
                  Hyderabad, Telangana, India
                </span>
              </li>
            </ul>
          </div>

          {socialLinks.length > 0 && <div><h3 className="font-bold mb-6">Follow Us</h3><div className="flex gap-3">{socialLinks.map(link => <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600">{link.name}</a>)}</div></div>}


        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm font-medium">
            {`© ${new Date().getFullYear()} Local Learn. All rights reserved.`}
          </p>
          <p className="text-gray-400 text-sm font-medium flex items-center gap-1">
            Built with <span className="text-red-500">❤️</span> for learners and educators.
          </p>
        </div>
      </div>
    </footer>
  );
}
