import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Video, Sparkles, CheckCircle2, Clock, ShieldAlert, Award } from 'lucide-react';

interface ServicesPageProps {
  openCart: () => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ openCart }) => {
  const { addToCart, prefersReducedMotion } = useApp();

  const services = [
    {
      id: 'service-1',
      name: 'Hair Assessment Guidance Call',
      price: 100.00,
      image: 'https://images.unsplash.com/photo-1595959183075-c1d0a5113cc3?auto=format&fit=crop&q=80&w=800',
      description: 'This one-hour personalized session provides an assessment of the client\'s hair, routine, and growth challenges. It complements the "31 Days to Success" eBook by helping clients understand their hair needs, proper products, daily routines, and long-term healthy growth strategies.',
      included: [
        'Introduction & Hair Assessment',
        'Identify Hair Goals',
        'Establish Hair Routine',
        'Long-Term Hair Strategy'
      ],
      benefits: [
        'Personalized recap',
        'Additional tools/templates',
        'Option for discounted follow-up coaching'
      ],
      notice: [
        'Confirmation may take up to 24 hours',
        'High-risk purchases may require verification',
        'Meeting link delivered by email',
        'Correct email address required'
      ],
      disclaimer: 'This is a virtual consultation. Not a physical product. All digital purchases are non-refundable.'
    },
    {
      id: 'service-2',
      name: 'Social Media Growth Coaching Call',
      price: 100.00,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
      description: 'A one-hour strategy session focused on social media growth, branding, and content strategy. Topics include content review, growth obstacles, personalized roadmap, visibility strategy, and consistency planning.',
      included: [
        'Goal setting',
        'Brand & niche identification',
        'Content pillars',
        'Long-term growth strategy'
      ],
      benefits: [
        'Personalized recap',
        'Templates and resources',
        'Optional follow-up coaching'
      ],
      notice: [
        'Confirmation within 24 hours',
        'High-risk purchases may require verification',
        'Meeting link sent by email'
      ],
      disclaimer: 'Virtual consultation only. Not a physical product. Digital purchases are non-refundable.'
    }
  ];

  const handleBookSession = (service: typeof services[0]) => {
    addToCart({
      id: service.id,
      type: 'service',
      name: service.name,
      price: service.price,
      image: service.image
    });
    openCart();
  };

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Page Header */}
      <div className="text-center mb-16 space-y-4">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold bg-brand-pink-light px-4 py-1.5 rounded-full select-none">
          1-on-1 Sessions
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-brand-dark tracking-tight">
          Private Consultations
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Book a private, virtual strategy call with Cartiae Rae to calibrate your personal coily hair routine or build a growth strategy for your brand.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
        {services.map((service) => (
          <motion.div
            key={service.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col bg-brand-cream border border-brand-warm-tan/30 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 text-left"
          >
            {/* Header Portrait/Cover */}
            <div className="relative aspect-[16/9] bg-brand-beige overflow-hidden">
              <img 
                src={service.image} 
                alt={service.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/65 via-brand-dark/15 to-transparent flex items-end p-6 sm:p-8">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-brand-pink font-bold font-mono">
                    Virtual Call • Zoom
                  </span>
                  <h2 className="font-serif text-lg sm:text-2xl text-[#FAF6F0] font-normal leading-tight">
                    {service.name}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
              
              <div className="space-y-6">
                {/* Description & Price */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-warm-tan/20 pb-4">
                  <p className="font-sans text-xs text-[#5C453C]/90 leading-relaxed sm:max-w-[70%]">
                    {service.description}
                  </p>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase tracking-wider text-brand-rose font-bold block mb-0.5">Price</span>
                    <span className="font-mono text-2xl font-bold text-brand-dark">${service.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Grid Lists (What is included & Benefits) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* What You'll Get */}
                  <div className="space-y-3">
                    <h4 className="font-serif text-xs font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-rose" />
                      <span>What You&apos;ll Get</span>
                    </h4>
                    <ul className="space-y-2">
                      {service.included.map((item, i) => (
                        <li key={i} className="font-sans text-[11px] text-[#5C453C]/80 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-rose shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Post-Call Benefits */}
                  <div className="space-y-3">
                    <h4 className="font-serif text-xs font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-brand-rose" />
                      <span>Post-Call Benefits</span>
                    </h4>
                    <ul className="space-y-2">
                      {service.benefits.map((item, i) => (
                        <li key={i} className="font-sans text-[11px] text-[#5C453C]/80 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-rose/65 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-brand-beige/35 border border-brand-warm-tan/20 rounded-2xl p-4 space-y-2.5">
                  <h4 className="font-serif text-[10px] font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-rose" />
                    <span>Important Notice</span>
                  </h4>
                  <ul className="space-y-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {service.notice.map((item, i) => (
                      <li key={i} className="font-sans text-[10.5px] text-[#6D5448] leading-normal flex items-start gap-1">
                        <span className="text-brand-rose select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Booking Button & Disclaimer */}
              <div className="space-y-4 pt-4 border-t border-brand-warm-tan/15">
                <button
                  onClick={() => handleBookSession(service)}
                  className="w-full bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(74,43,32,0.12)] hover:shadow-lg focus:outline-none"
                >
                  <Video className="w-4 h-4" />
                  <span>Book Coaching Session (${service.price.toFixed(2)})</span>
                </button>
                
                {/* Disclaimer */}
                <div className="flex items-start gap-1.5 text-[9.5px] text-[#6D5448]/75 leading-normal">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#A67E6B] shrink-0 mt-0.5" />
                  <p className="italic font-sans">
                    <strong>Disclaimer:</strong> {service.disclaimer}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
