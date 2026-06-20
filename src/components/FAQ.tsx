import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const revealItem = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "When will I receive my purchased eBooks?",
      answer: "Your eBook is delivered instantly after purchase. A download link appears on your confirmation page, and a copy is also sent to your email for future access."
    },
    {
      question: "Do I offer 1-on-1 consultations?",
      answer: "Yes. Consultations are private personalized sessions tailored to your goals. After booking, you will receive a confirmation email with your meeting details and everything you need to prepare."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={revealContainer}
      className="max-w-4xl mx-auto px-6 text-brand-dark" 
      id="faq-section"
    >
      <motion.div variants={revealItem} className="text-center space-y-3 mb-10">
        <span className="text-[10px] uppercase tracking-[0.3em] text-brand-berry font-bold block">
          Support &amp; Details
        </span>
        <h2 className="font-serif text-3xl font-normal text-brand-dark">
          Frequently Asked Questions
        </h2>
        <div className="h-[1px] w-12 bg-brand-rose/40 mx-auto mt-2" />
      </motion.div>

      <motion.div 
        variants={revealItem}
        className="space-y-2 bg-brand-cream p-6 sm:p-8 border border-brand-warm-tan/20 rounded-sm"
      >
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <motion.div
              variants={revealItem}
              key={index}
              id={`faq-item-${index}`}
              className="border-b border-brand-warm-tan/30 last:border-0 pb-3 pt-3 transition-colors"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left py-3.5 focus:outline-none focus:text-brand-rose group cursor-pointer"
                id={`faq-btn-${index}`}
              >
                <span className="font-serif text-base sm:text-lg text-brand-dark group-hover:text-brand-rose transition-colors pr-6 font-normal">
                  {faq.question}
                </span>
                <span className="shrink-0 p-1.5 bg-brand-cream rounded-full border border-brand-warm-tan/15 text-brand-dark/50 group-hover:text-brand-rose group-hover:border-brand-rose/20 transition-all">
                  {isOpen ? (
                    <Minus className="w-3.5 h-3.5 stroke-[2]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[2]" />
                  )}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="font-sans text-xs sm:text-sm text-zinc-500 leading-relaxed pb-4 pt-1 pr-6">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
};
