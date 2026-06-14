import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles } from 'lucide-react';

export const AboutAndBlog: React.FC = () => {
  const { homepageContent } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
      {/* Page Title */}
      <div className="text-center mb-16 space-y-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          Meet the Founder
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark font-normal">
          Our Story &amp; Philosophy
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Simple steps, healthy hair habits, and real results.
        </p>
      </div>

      <div className="space-y-16">
        {/* Main profile split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Image side */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] overflow-hidden border border-brand-warm-tan/20 bg-[#FAF6F0]">
              <img
                src="/about-portrait.jpg"
                alt="Cartiae Portrait"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Simple highlighted sticker */}
            <div className="absolute -bottom-4 -right-4 bg-brand-dark text-white p-4 shadow-md max-w-[180px] hidden sm:block">
              <Sparkles className="w-4 h-4 text-brand-rose mb-1" />
              <p className="font-serif text-xs font-normal text-[#FAF6F0]">Natural &amp; Simple</p>
              <p className="text-[10px] text-brand-beige/80 mt-0.5 leading-normal">
                Regimens made easy for real daily life.
              </p>
            </div>
          </div>

          {/* Content text side */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark leading-tight">
              {homepageContent.aboutHeadline || "Healthy hair is a journey, not a quick fix."}
            </h2>
            <div className="h-[1px] w-16 bg-brand-rose" />
            
            <p className="font-sans text-xs sm:text-sm text-brand-dark/80 leading-relaxed whitespace-pre-wrap">
              {homepageContent.aboutStory}
            </p>

            {/* Simple Quote panel */}
            <div className="p-6 bg-brand-beige/30 border-l-2 border-brand-rose">
              <p className="font-serif italic text-xs sm:text-sm text-[#5C453C]">
                &ldquo;{homepageContent.promoQuote}&rdquo;
              </p>
              <p className="font-sans text-[10px] uppercase font-bold text-brand-rose mt-2">
                — {homepageContent.promoAuthor}
              </p>
            </div>
          </div>
        </div>

        {/* Three pillars values panel */}
        <div className="pt-12 border-t border-brand-warm-tan/20">
          <h3 className="font-serif text-xl text-brand-dark text-center mb-10">Our Principles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="text-brand-rose text-2xl font-serif">01.</span>
              <h4 className="font-serif text-sm text-brand-dark">No Shortcuts</h4>
              <p className="text-brand-dark/70 text-xs font-sans leading-relaxed">
                Consistency, water-moisture, and gentle handling are the only things that truly help natural hair grow.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-brand-rose text-2xl font-serif">02.</span>
              <h4 className="font-serif text-sm text-brand-dark">Deep Moisture</h4>
              <p className="text-brand-dark/70 text-xs font-sans leading-relaxed">
                We teach you how to hydrate your strands with water, and block that moisture in using natural lipid oils.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-brand-rose text-2xl font-serif">03.</span>
              <h4 className="font-serif text-sm text-brand-dark">Gentle Care</h4>
              <p className="text-brand-dark/70 text-xs font-sans leading-relaxed">
                We design our detangling routines and products to prevent shedding and keep your hair strands safe from breaking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
