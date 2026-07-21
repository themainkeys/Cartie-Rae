import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, ArrowRight, Sparkles, Check } from 'lucide-react';

interface FooterProps {
  setActivePart: (part: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActivePart }) => {
  const { signupNewsletter } = useApp();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please Enter a complete email address.');
      return;
    }

    const res = signupNewsletter(email);
    if (res) {
      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError('Please provide a valid email structure.');
    }
  };

  return (
    <footer className="bg-brand-dark text-brand-beige border-t border-brand-chocolate/50">
      
      {/* Main Footer Sitemap Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-brand-chocolate/30 pb-12">
          {/* Column 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <h4 className="font-serif text-2xl tracking-wide text-brand-cream">Cartiae Rae</h4>
            <p className="font-sans text-xs text-brand-beige/60 leading-relaxed max-w-sm">
              Helping you understand, care for, and grow healthy natural hair through simple wash day steps and treatment routines.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a
                href="https://tiktok.com/@cartiaerae"
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-widest text-brand-beige hover:text-brand-rose transition-colors"
                aria-label="TikTok"
              >
                TikTok
              </a>
              <span className="text-brand-chocolate/50">/</span>
              <a
                href="https://instagram.com/cartiaerae"
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-widest text-brand-beige hover:text-brand-rose transition-colors"
                aria-label="Instagram"
              >
                Instagram
              </a>
            </div>

            {/* Newsletter signup — functional in demo/local mode (stores locally). */}
            <div className="pt-4 max-w-sm">
              <h5 className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-brand-rose mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Join the List
              </h5>
              {success ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>You're on the list — thank you!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-1.5" noValidate>
                  <div className="flex items-stretch gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-beige/40" />
                      <input
                        id="footer-newsletter-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        aria-label="Email address for newsletter"
                        className="w-full pl-9 pr-3 py-2.5 bg-brand-chocolate/20 border border-brand-chocolate/40 rounded-lg text-xs text-brand-cream placeholder-brand-beige/40 focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      aria-label="Subscribe to newsletter"
                      className="shrink-0 flex items-center justify-center px-3.5 bg-brand-rose hover:bg-brand-berry text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-rose/40"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {error && <p className="text-[10px] text-brand-rose font-medium pl-1">{error}</p>}
                  <p className="text-[10px] text-brand-beige/40 pl-1">Wash-day tips &amp; new guides. No spam.</p>
                </form>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3">
            <h5 className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-brand-rose mb-4">
              Explore
            </h5>
            <ul className="space-y-2.5 font-sans text-xs text-brand-beige/70">
              <li>
                <button onClick={() => setActivePart('shop')} className="hover:text-brand-rose focus:outline-none transition-colors">
                  Shop All Essentials
                </button>
              </li>
              <li>
                <button onClick={() => setActivePart('services')} className="hover:text-brand-rose focus:outline-none transition-colors">
                  Coaching &amp; Services
                </button>
              </li>
              <li>
                <button onClick={() => setActivePart('tutorials')} className="hover:text-brand-rose focus:outline-none transition-colors">
                  Visuals
                </button>
              </li>
              <li>
                <button onClick={() => setActivePart('gallery')} className="hover:text-brand-rose focus:outline-none transition-colors">
                  Lookbook
                </button>
              </li>
              <li>
                <button onClick={() => setActivePart('about')} className="hover:text-brand-rose focus:outline-none transition-colors">
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="md:col-span-4">
            <h5 className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-brand-rose mb-4">
              Customer Support
            </h5>
            <ul className="space-y-2.5 font-sans text-xs text-brand-beige/70 font-medium">
              <li>
                <button onClick={() => setActivePart('contact')} className="hover:text-brand-rose focus:outline-none transition-colors">
                  Consultation Booking
                </button>
              </li>
              <li>
                <button onClick={() => setActivePart('contact')} className="hover:text-brand-rose focus:outline-none transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
              <li className="text-[11px] text-brand-beige/40">
                Email: orders@cartiaerae.com
              </li>
              <li className="text-[11px] text-brand-beige/40">
                Fulfillment: Instant Digital Delivery
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Copyright Area */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-[10px] text-brand-beige/40">
          <p>© 2026 Cartiae Rae Beauty, LLC. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-brand-rose transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-brand-rose transition-colors">Terms &amp; Conditions</a>
            <button onClick={() => setActivePart('admin')} className="hover:text-brand-rose focus:outline-none underline">
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
