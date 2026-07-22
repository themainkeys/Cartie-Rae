import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, Calendar, Sparkles, ShieldCheck, 
  MessageSquare, ChevronDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ContactPage: React.FC = () => {
  const { signupNewsletter, addContactRequest, prefersReducedMotion } = useApp();

  // Contact Message form state
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgPhone, setMsgPhone] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [agreeNewsletter, setAgreeNewsletter] = useState(false);

  // Accordion state
  const [openedFaq, setOpenedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'When will I receive my purchased eBooks?',
      a: 'Your eBook is delivered instantly after purchase. A download link appears on your confirmation page, and a copy is also sent to your email for future access.'
    },
    {
      q: 'Do I offer 1-on-1 consultations?',
      a: 'Yes. Consultations are private personalized sessions tailored to your goals. After booking, you will receive a confirmation email with your meeting details and everything you need to prepare.'
    }
  ];

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgName || !msgEmail || !msgText) return;
    
    addContactRequest({
      name: msgName,
      email: msgEmail,
      phone: msgPhone || undefined,
      message: msgText
    });

    setMsgSuccess(true);
    if (agreeNewsletter) signupNewsletter(msgEmail);
    
    // clear fields
    setMsgName('');
    setMsgEmail('');
    setMsgPhone('');
    setMsgText('');
    setAgreeNewsletter(false);
    setTimeout(() => setMsgSuccess(false), 5000);
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="text-center mb-12">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold bg-brand-pink-light px-3.5 py-1.5 rounded-full select-none">
          Get In Touch Studio
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark mt-4">
          Contact &amp; Personal Coaching
        </h1>
        <p className="font-sans text-xs sm:text-sm text-zinc-400 mt-3 max-w-xl mx-auto leading-relaxed">
          Have an inquiry about tracking or desire a comprehensive personal schedule review? Reach out below or request a digital Zoom meeting directly.
        </p>
      </div>

      {/* Main Dual grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
        
        {/* Left Column: Direct message desk */}
        <div className="lg:col-span-7 bg-brand-cream border border-brand-warm-tan/30 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-brand-warm-tan/20 pb-3 select-none">
            <MessageSquare className="w-5 h-5 text-brand-rose" />
            <h3 className="font-serif text-lg font-bold text-brand-dark">Send a Direct Message</h3>
          </div>

          <form onSubmit={handleMessageSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10.5px] uppercase font-bold text-zinc-500 mb-1.5">Your Full Name *</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Elena Rivers"
                  value={msgName}
                  onChange={(e) => setMsgName(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[10.5px] uppercase font-bold text-zinc-500 mb-1.5">Email Address *</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="elena.rivs@gmail.com"
                  value={msgEmail}
                  onChange={(e) => setMsgEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[10.5px] uppercase font-bold text-zinc-500 mb-1.5">Phone Number</label>
                <input
                  id="contact-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={msgPhone}
                  onChange={(e) => setMsgPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1.5">How can we support you? *</label>
              <textarea
                id="contact-message"
                required
                rows={4}
                placeholder="Detail your challenges..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                className="w-full px-4 py-3 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all font-sans"
              />
            </div>

            {/* Newsletter opt-in checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                id="contact-newsletter-opt-in"
                type="checkbox"
                checked={agreeNewsletter}
                onChange={e => setAgreeNewsletter(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#C9184A] rounded cursor-pointer"
              />
              <span className="font-sans text-[11px] text-zinc-500 leading-relaxed group-hover:text-zinc-700 transition-colors">
                Subscribe me to updates, eBook releases, and hair care tips. You can unsubscribe anytime.
              </span>
            </label>

            <motion.button
              id="submit-contact-msg"
              type="submit"
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.99 }}
              className="w-full bg-brand-rose hover:bg-brand-berry text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Message to Cartiae Rae</span>
            </motion.button>
          </form>

          <AnimatePresence>
            {msgSuccess && (
              <motion.p 
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-medium flex items-center justify-center gap-1.5 mt-4 text-left shadow-sm"
              >
                <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span>Message dispatched! Cartiae typically replies within 24 business hours.</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Services referral card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white text-brand-dark border-2 border-brand-warm-tan/50 rounded-3xl p-6 space-y-5 text-left shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-warm-tan/25 pb-3 select-none">
              <Calendar className="w-5 h-5 text-brand-rose" />
              <h3 className="font-serif text-lg font-bold text-brand-dark">Book a Private Session</h3>
            </div>

            <p className="font-sans text-xs text-brand-dark/70 leading-relaxed">
              Ready to go deeper? Book a private 1-on-1 virtual strategy call with Cartiae Rae — available as a Hair Assessment Guidance Call or a Social Media Growth Coaching Call.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-brand-cream/80 border border-brand-warm-tan/30 rounded-2xl p-4">
                <Sparkles className="w-4 h-4 text-brand-rose shrink-0 mt-0.5" />
                <div>
                  <p className="font-serif text-sm text-brand-dark font-semibold">Hair Assessment Guidance Call</p>
                  <p className="font-sans text-xs text-brand-dark/60 mt-0.5">Personalized routine review, goal setting &amp; long-term growth strategy.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-brand-cream/80 border border-brand-warm-tan/30 rounded-2xl p-4">
                <Sparkles className="w-4 h-4 text-brand-rose shrink-0 mt-0.5" />
                <div>
                  <p className="font-serif text-sm text-brand-dark font-semibold">Social Media Growth Coaching Call</p>
                  <p className="font-sans text-xs text-brand-dark/60 mt-0.5">Brand strategy, content pillars &amp; visibility roadmap.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-brand-warm-tan/25">
              <p className="font-mono text-2xl font-bold text-brand-dark">$100<span className="text-sm font-sans font-normal text-brand-dark/50 ml-1">/ session</span></p>
              <p className="font-sans text-xs text-brand-dark/50 mt-1">Virtual Zoom • Confirmation within 24 hrs</p>
            </div>
          </div>

          <div className="bg-brand-cream border border-brand-warm-tan/30 rounded-2xl p-4 text-[11px] text-zinc-400 font-semibold space-y-2 text-left select-none">
            <p className="flex items-center gap-2 text-brand-rose">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>SECURE PRIVATE CALL LINK</span>
            </p>
            <p className="leading-relaxed text-[10.5px]">
              All conversations are discrete. Meeting details delivered by email within 24 hours of booking confirmation.
            </p>
          </div>
        </div>

      </div>

      {/* Frequently Asked Questions accordion using motion transitions */}
      <div className="max-w-4xl mx-auto space-y-4 pt-10 border-t border-brand-warm-tan/20">
        <h3 className="font-serif text-2xl font-bold text-center text-brand-dark mb-6">Frequently Asked Questions</h3>
        
        {faqs.map((faq, fIndex) => {
          const isOpen = openedFaq === fIndex;
          return (
            <div
              key={fIndex}
              onClick={() => setOpenedFaq(isOpen ? null : fIndex)}
              className="bg-brand-cream rounded-2xl border border-brand-warm-tan/25 overflow-hidden transition-all duration-300 cursor-pointer"
            >
              {/* Header clickable */}
              <div
                id={`faq-btn-${fIndex}`}
                className="p-4 sm:p-5 flex items-center justify-between text-left select-none text-brand-dark font-serif text-sm font-semibold hover:text-brand-rose transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Collapsed body with height animation */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden border-t border-brand-warm-tan/10 bg-brand-cream"
                  >
                    <p className="px-4 sm:px-5 pb-5 pt-3 text-xs text-zinc-500 leading-relaxed font-sans text-left">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </div>
  );
};
