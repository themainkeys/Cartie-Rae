import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Mail, Calendar, HelpCircle, ChevronDown, Check, Send, 
  Sparkles, ShieldCheck, UserCheck, Video, Clock, MessageSquare,
  Camera, Upload, X
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { signupNewsletter, addContactRequest } = useApp();

  // Contact Message form state
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgPorosity, setMsgPorosity] = useState('Low Porosity 4C');
  const [msgText, setMsgText] = useState('');
  const [msgPhoto, setMsgPhoto] = useState('');
  const [msgSuccess, setMsgSuccess] = useState(false);

  // Accordion state
  const [openedFaq, setOpenedFaq] = useState<number | null>(0);

  // VIP Appointments state
  const [apptTier, setApptTier] = useState<'Standard (15 min Zoom)' | 'Elite Routine Review (45 min Zoom)'>('Standard (15 min Zoom)');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptSuccess, setApptSuccess] = useState(false);

  const faqs = [
    {
      q: 'When will I receive my purchased eBooks?',
      a: 'Your eBooks are delivered instantly! The moments your simulated sandbox checkout is approved, high-speed download links appear directly on your success screen. Additionally, we transmit a permanent download invoice with a visual copy directly to your inbox.'
    },
    {
      q: 'Do you offer virtual 1-on-1 consultations?',
      a: 'Absolutely! We offer personalized session slots where we review your current routine, porosity challenges, and formulate a step-by-step master hair growth calendar together. You can register your slot using the schedule desk above!'
    },
    {
      q: 'How long does shipping take for botanical oils?',
      a: 'We package physical hair dropper orders within 48 business hours using delicate organic linen wrap to preserve botanical extracts. Standard shipping inside the US requires 3-5 business days. International delivery takes 7-10 business days.'
    },
    {
      q: 'Can I apply the Botanical Growth Oil to relaxed or protective styles?',
      a: 'Yes, absolutely! The castor and rosemary formula is highly effective at stimulating dead scalp follicles under tight styles (tuck-ins, cornrows, wigs) with zero residue. It is also excellent to hydrate weak edges on chemically altered hair.'
    }
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose a file smaller than 2MB for storage performance.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMsgPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgName || !msgEmail || !msgText) return;
    
    // Save to AppContext state securely
    addContactRequest({
      name: msgName,
      email: msgEmail,
      porosity: msgPorosity,
      message: msgText,
      photoAttachment: msgPhoto || undefined
    });

    setMsgSuccess(true);
    // signup to list as a courtesy
    signupNewsletter(msgEmail);
    // clear fields
    setMsgName('');
    setMsgEmail('');
    setMsgText('');
    setMsgPhoto('');
    setTimeout(() => setMsgSuccess(false), 5000);
  };

  const handleBookAppt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDate || !apptTime) return;
    setApptSuccess(true);
    setTimeout(() => {
      setApptSuccess(false);
      setApptDate('');
      setApptTime('');
    }, 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="text-center mb-12">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold bg-brand-pink-light px-3 py-1 rounded-full">
          Get In Touch Studio
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark mt-4">
          Contact &amp; Personal Coaching
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6B5145] mt-3 max-w-xl mx-auto leading-relaxed">
          Have an inquiry about tracking or desire a comprehensive personal schedule review? Reach out below or request a digital Zoom meeting directly.
        </p>
      </div>

      {/* Main Dual grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
        
        {/* Left Column: Direct message desk */}
        <div className="lg:col-span-7 bg-brand-cream border border-brand-warm-tan/30 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-brand-warm-tan/20 pb-3">
            <MessageSquare className="w-5 h-5 text-brand-rose" />
            <h3 className="font-serif text-lg font-bold text-brand-dark">Send a Direct Message</h3>
          </div>

          <form onSubmit={handleMessageSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Your Full Name *</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Elena Rivers"
                  value={msgName}
                  onChange={(e) => setMsgName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-rose"
                />
              </div>
              <div>
                <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Email Address *</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="elena.rivs@gmail.com"
                  value={msgEmail}
                  onChange={(e) => setMsgEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-rose"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Porosity / Hair-Type Category</label>
                <select
                  id="contact-porosity"
                  value={msgPorosity}
                  onChange={(e) => setMsgPorosity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-rose font-medium text-brand-chocolate"
                >
                  <option>Low Porosity 4C</option>
                  <option>High Porosity 4C</option>
                  <option>Unsure / Transitioning</option>
                  <option>Locs / Protective Style</option>
                </select>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-brand-rose bg-brand-pink-light/65 px-2.5 py-1 rounded-md font-sans font-semibold leading-normal">
                  💡 High porosity and low porosity require completely different sealing procedures!
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">How can we support you? *</label>
              <textarea
                id="contact-message"
                required
                rows={4}
                placeholder="Detail your challenges (such as split ends, detangling snags, dry scalp conditions)..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                className="w-full px-3 py-2.5 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-rose font-sans"
              />
            </div>

            <div>
              <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Attach a Reference Photo of your hair (Optional)</label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex-1 w-full">
                  <label className="flex flex-col items-center justify-center border border-dashed border-brand-warm-tan/50 bg-[#FAF6F0] rounded-xl p-4 cursor-pointer hover:border-brand-rose/50 transition">
                    <div className="flex items-center gap-2 text-[#7C6354]">
                      <Camera className="w-5 h-5 text-brand-rose" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Upload / Snap Photo</span>
                    </div>
                    <span className="text-[10px] text-[#A67E6B] mt-1">PNG, JPG up to 2MB</span>
                    <input
                      type="file"
                      id="contact-photo-upload"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1 w-full">
                  <span className="block text-[10px] text-[#7C6354] uppercase font-semibold mb-1">Or Paste Image URL</span>
                  <input
                    type="url"
                    id="contact-photo-url"
                    placeholder="https://example.com/hair.jpg"
                    value={msgPhoto.startsWith('data:') ? '' : msgPhoto}
                    onChange={(e) => setMsgPhoto(e.target.value)}
                    className="w-full px-3 py-2.5 bg-brand-cream border border-brand-warm-tan/40 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-rose"
                  />
                </div>
              </div>
              {msgPhoto && (
                <div className="mt-3 flex items-center gap-2 bg-brand-pink-light/35 p-2 rounded-xl border border-brand-rose/10 w-fit">
                  <img src={msgPhoto} alt="Preview" className="w-10 h-10 object-cover rounded border border-brand-warm-tan/20" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-brand-rose uppercase">Photo Attached Successfully</p>
                    <button
                      type="button"
                      onClick={() => setMsgPhoto('')}
                      className="text-[9px] text-red-600 hover:underline font-bold"
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              id="submit-contact-msg"
              type="submit"
              className="w-full bg-brand-rose hover:bg-brand-berry text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Message to Cartiae</span>
            </button>
          </form>

          {msgSuccess && (
            <p className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg text-center font-medium flex items-center justify-center gap-1.5 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Message dispatched! Cartiae typically replies within 24 business hours.</span>
            </p>
          )}
        </div>

        {/* Right Column: Virtual consultation scheduler overlay */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-brand-dark text-brand-cream border border-brand-chocolate/40 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Video className="w-5 h-5 text-brand-pink" />
              <h3 className="font-serif text-lg font-bold text-white">Book a Virtual Consultation</h3>
            </div>

            <p className="font-sans text-[11px] text-brand-beige/70 leading-relaxed">
              Book a live 1-on-1 Zoom call with Cartiae to examine your texture under real-time lighting, inspect cuticle condition, and tailor a custom length retention plan.
            </p>

            <form onSubmit={handleBookAppt} className="space-y-4">
              <div>
                <label className="block text-[9.5px] uppercase font-bold text-brand-pink tracking-wider mb-1">Select Consultation Tier</label>
                <select
                  id="appt-tier"
                  value={apptTier}
                  onChange={(e) => setApptTier(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-brand-chocolate/40 border border-[#FAF6F0]/20 text-[#FAF6F0] text-xs rounded-lg focus:outline-none"
                >
                  <option>Standard (15 min Zoom) — $25.00</option>
                  <option>Elite Routine Review (45 min Zoom) — $75.00</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-brand-pink tracking-wider mb-1">Pick Date</label>
                  <input
                    id="appt-date"
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-chocolate/40 border border-[#FAF6F0]/20 text-white text-xs rounded-lg focus:outline-none font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-brand-pink tracking-wider mb-1">Pick Time Slot</label>
                  <select
                    id="appt-time"
                    required
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-brand-chocolate/40 border border-[#FAF6F0]/20 text-white text-xs rounded-lg focus:outline-none"
                  >
                    <option value="">Choose...</option>
                    <option value="10:00 AM">10:00 AM EDT</option>
                    <option value="12:30 PM">12:30 PM EDT</option>
                    <option value="03:00 PM">03:00 PM EDT</option>
                    <option value="05:30 PM">05:30 PM EDT</option>
                  </select>
                </div>
              </div>

              <button
                id="appt-submit-btn"
                type="submit"
                className="w-full bg-brand-rose hover:bg-brand-berry text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-brand-pink" />
                <span>Book Booking Slot</span>
              </button>
            </form>

            {apptSuccess && (
              <div className="p-4 rounded-xl bg-brand-chocolate/50 border border-brand-pink/30 text-xs text-center space-y-1 text-white select-none">
                <p className="font-serif font-bold text-brand-pink flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-brand-pink" /> Booking Complete!
                </p>
                <p className="text-[10px] text-brand-beige/80 mt-1">
                  A Zoom scheduling invitation has been sent directly to your account.
                </p>
              </div>
            )}
          </div>

          <div className="bg-brand-cream border border-brand-warm-tan/30 rounded-2xl p-4 text-[11px] text-[#8C6D62] font-semibold space-y-2">
            <p className="flex items-center gap-2 text-brand-rose">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>SECURE PRIVATE CALL LINK</span>
            </p>
            <p className="leading-relaxed text-[10.5px]">
              All conversations are discrete. We inspect follicles in high-contrast detail, analyzing breakage lines without judgment. You are in safe expert hands.
            </p>
          </div>
        </div>

      </div>

      {/* Frequently Asked Questions accordion */}
      <div className="max-w-4xl mx-auto space-y-4 pt-10 border-t border-brand-warm-tan/20">
        <h3 className="font-serif text-2xl font-bold text-center text-brand-dark mb-6">Frequently Answered Questions</h3>
        
        {faqs.map((faq, fIndex) => {
          const isOpen = openedFaq === fIndex;
          return (
            <div
              key={fIndex}
              onClick={() => setOpenedFaq(isOpen ? null : fIndex)}
              className="bg-brand-cream rounded-xl border border-brand-warm-tan/25 overflow-hidden transition-all duration-300 cursor-pointer"
            >
              {/* Header clickable */}
              <div
                id={`faq-btn-${fIndex}`}
                className="p-4 sm:p-5 flex items-center justify-between text-left select-none text-brand-dark font-serif text-sm font-semibold hover:text-brand-rose transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#8C6D62] transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Collapsed body */}
              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-[#6B5145] leading-relaxed border-t border-brand-warm-tan/10 font-sans">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
