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
      question: "How often should I moisturize my 4C natural hair?",
      answer: "Since 4C hair's tight, zigzag coil pattern prevents your scalp's natural sebum from easily traveling down the hair shaft, dry strands are common. We recommend moisturizing every 2 to 3 days using the L.C.O. (Liquid/Leave-In, Cream, Oil) method to seal in rich hydration without weighing down fine fibers."
    },
    {
      question: "Why is shrinkage natural, and how should I manage it?",
      answer: "Shrinkage is a sign of highly elastic, healthy, and hydrated hair—it can shrink up to 75% of its true length when wet. Instead of fighting it with strong high-heat styling tools, embrace it, or manage it gently using heatless stretching methods like banding, threading, flat-twists, or chunky braids."
    },
    {
      question: "Is it possible to grow short 4C hair past active shoulder-length?",
      answer: "Absolutely. All healthy hair grows continuously, but 4C strands are delicate and prone to breaking at the ends. Retaining length is the secret: focus on deep conditioning, minimizing daily manual manipulation, keeping ends tucked into protective styles, and shielding strands from dry fabrics using mulberry silk bonnets."
    },
    {
      question: "How do I prevent single-strand knots (fairy knots) to keep ends smooth?",
      answer: "Single-strand knots occur when coily strands curl back into themselves and tie a knot. You can reduce them by keeping your hair stretched rather than fully shrunken, detangling only with generous conditioner slip, trimming weathered tips with professional shears, and sleeping on friction-free satin pillowcases."
    },
    {
      question: "Should my daily routine prioritize proteins or moisture?",
      answer: "For natural 4C coily hair, daily hydration should rely on water and humectant solutions (like aloe vera liquid) locked in by rich botanical oils. Protein treatments should be reserved as a structured monthly or bi-monthly remedy to reinforce structural cuticle integrity without inducing hardness or brittleness."
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
          Education & Answers
        </span>
        <h2 className="font-serif text-3xl font-normal text-brand-dark">
          Common 4C Care Questions
        </h2>
        <div className="h-[1px] w-12 bg-brand-rose/40 mx-auto mt-2" />
      </motion.div>

      <motion.div 
        variants={revealItem}
        className="space-y-2 bg-[#FAF6F0] p-6 sm:p-8 border border-brand-warm-tan/20 rounded-sm"
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
                    <p className="font-sans text-xs sm:text-sm text-[#5C453C]/90 leading-relaxed pb-4 pt-1 pr-6">
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
