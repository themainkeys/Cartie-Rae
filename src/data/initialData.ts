import { EBook, Product, TikTokVideo, PhotoGalleryItem, BlogPost, DiscountCode, HomepageContent } from '../types';

export const initialEBooks: EBook[] = [
  {
    id: 'ebook-1',
    name: 'The 4C Growth Blueprint',
    price: 24.99,
    description: 'A comprehensive, step-by-step master guide detailing how to safely grow, hydrate, and retain lengths of natural fine 4C coils. Based on years of trial, research, and proven methods.',
    image: 'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800',
    pages: 153,
    fileSize: '14.2 MB',
    isFeatured: true,
    benefits: [
      'Understand low vs high porosity daily routines',
      'The exact dynamic detangling sequence to prevent breakage',
      'Protective styling schedules that maximize growth retention',
      'The science of deep conditioning fine 4C coils'
    ],
    pdfUrl: '4c_growth_blueprint_cartiae_rae.pdf',
    reviews: [
      {
        id: 'rev-eb1-1',
        rater: 'Keisha L.',
        score: 5,
        comment: 'This book literally changed my relationship with my fine 4C hair. Finally, a guide that understands fragile coils!',
        date: '2026-05-18'
      },
      {
        id: 'rev-eb1-2',
        rater: 'Aaliyah M.',
        score: 5,
        comment: 'Every page is packed with real actionable steps, not just fluff. Highly recommend!',
        date: '2026-06-01'
      }
    ]
  },
  {
    id: 'ebook-2',
    name: 'Wash Day Mastery',
    price: 19.99,
    description: 'Vastly streamline your wash day protocol. Go from a grueling 6-hour struggle to a highly clinical, hyper-moisturizing 90-minute routine.',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430f33?auto=format&fit=crop&q=80&w=800',
    pages: 87,
    fileSize: '8.7 MB',
    isFeatured: false,
    benefits: [
      'Streamline cleansing, pre-pooing, and styling',
      'Reduce tangling during the washing sequence',
      'Sectioning strategies designed for active schedules',
      'Recommended safe non-stripping shampoo alternatives'
    ],
    pdfUrl: 'wash_day_mastery_cartiae_rae.pdf',
    reviews: [
      {
        id: 'rev-eb2-1',
        rater: 'Brianna S.',
        score: 5,
        comment: 'I used to dread wash days. Now it is a smooth, structured self-care session of 90 minutes. Incredible!',
        date: '2026-05-24'
      }
    ]
  },
  {
    id: 'ebook-3',
    name: 'The Protective Style Playbook',
    price: 15.99,
    description: 'Learn the exact tension-free cornrowing, weaving, and twisting procedures that keep your hairline robust while preserving length.',
    image: 'https://images.unsplash.com/photo-1595959183075-c1d09e771481?auto=format&fit=crop&q=80&w=800',
    pages: 64,
    fileSize: '6.1 MB',
    isFeatured: false,
    benefits: [
      'Scalp hydration methods underneath synthetic hair',
      'Step-by-step guidelines to prevent tension alopecia',
      'Takedown routines to safely melt tangles and shed hair',
      'Nighttime friction-free maintenance protocols'
    ],
    pdfUrl: 'protective_styles_playbook.pdf',
    reviews: []
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Botanical Growth Oil',
    price: 38.00,
    description: 'A curated elixir designed specifically for fine 4C hair textures. This potent organic fusion stimulates the scalp follicles while locking in essential cellular-level moisture.',
    category: 'Hair Oils',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800',
    stockStatus: 'In Stock',
    stockCount: 142,
    isFeatured: true,
    ingredients: [
      'Organic Cold-Pressed Castor Oil',
      'Rosmarinus Officinalis (Rosemary) Extract',
      'Argania Spinosa (Argan) Kernel Oil',
      'Mentha Piperita (Peppermint) Leaf Oil',
      'Simmondsia Chinensis (Jojoba) Seed Oil'
    ],
    howToUse: [
      'Section hair into four distinct quadrants and apply 3-5 drops per section directly to the scalp.',
      'Massage into the scalp in gentle circular motions for 2 minutes to stimulate oxygenation and direct blood flow.',
      'Smooth excess oil through to the ends of the strands. Style as usual.'
    ],
    reviews: [
      {
        id: 'rev-p1-1',
        rater: 'Nia J.',
        score: 5,
        comment: 'Finally found an oil that does not just sit on top of my hair. My edges are actually filling back in after three weeks of nightly scalp massage!',
        date: '2026-05-15'
      },
      {
        id: 'rev-p1-2',
        rater: 'Sarah M.',
        score: 5,
        comment: 'The peppermint scent is so refreshing. It gives my scalp that high-end clinical tingle I love. Worth every single penny.',
        date: '2026-05-29'
      },
      {
        id: 'rev-p1-3',
        rater: 'Elena R.',
        score: 5,
        comment: 'I use it for my braid-outs and the high-contrast shine is unbelievable! 4C hair needs this kind of luxurious treatment.',
        date: '2026-06-03'
      }
    ]
  },
  {
    id: 'prod-2',
    name: 'Silk Sleep Cap',
    price: 25.00,
    description: '100% pure premium mulberry silk bonnet (Grade 6A, 22 momme) to prevent overnight split ends, reduce strand friction, and maintain protective hairstyle integrity.',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    stockStatus: 'In Stock',
    stockCount: 88,
    isFeatured: true,
    ingredients: ['100% Natural Mulberry Silk', 'Soft Hypoallergenic Latex Elastic'],
    howToUse: [
      'Gently gathering coils into a loose pineapple or twist style.',
      'Slip the cozy silk cap over the rear scalp first and stretch forward to cover your hairline.',
      'Hand-wash in lukewarm water with silk-safe detergent once every two weeks.'
    ],
    reviews: [
      {
        id: 'rev-p2-1',
        rater: 'Tamera W.',
        score: 5,
        comment: 'Does not slide off my head at night! The band is super soft and my hair stays perfectly moisturized.',
        date: '2026-06-02'
      }
    ]
  },
  {
    id: 'prod-3',
    name: 'Detangling Collection',
    price: 45.00,
    description: 'Sandalwood Wide-Tooth Detangler & Organic Hair Pick combination. Specially designed wide spaces glide through fragile 4C curly intersections without snagging.',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=800',
    stockStatus: 'Low Stock',
    stockCount: 12,
    isFeatured: false,
    ingredients: ['Natural Green Sandalwood'],
    howToUse: [
      'Always detangle damp 4C coils saturated with conditioner.',
      'Start combing gently at the very ends of the hair, slowly working your way up to the roots in sections.',
      'Store in a cool dry drawer to keep the rich herbal sandalwood aroma fresh.'
    ],
    reviews: []
  },
  {
    id: 'prod-4',
    name: 'Deep Repair Mask',
    price: 32.00,
    description: 'Intense hydration restorative cream treatment formulated to penetrates tough low-porosity hair shafts. Floods thirsty cells with plant proteins to halt active breakage.',
    category: 'Treatments',
    image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?auto=format&fit=crop&q=80&w=800',
    stockStatus: 'In Stock',
    stockCount: 95,
    isFeatured: false,
    ingredients: [
      'Deionized Water',
      'Shea Butter Alcohols',
      'Hydrolyzed Wheat Protein',
      'Aloe Barbadensis Juice',
      'Avocado Oil Extract'
    ],
    howToUse: [
      'Apply standard dollop onto freshly washed, damp hair.',
      'Distribute evenly and cover with a warm plastic cap for 20-30 minutes.',
      'Rinse out thoroughly with cool water to seal the outer cuticles.'
    ],
    reviews: [
      {
        id: 'rev-p4-1',
        rater: 'Maya D.',
        score: 5,
        comment: 'My hair felt like absolute butter after rinsing this. Best deep conditioner I have ever touched for 4C hair!',
        date: '2026-06-05'
      }
    ]
  }
];

export const initialVideos: TikTokVideo[] = [
  {
    id: 'vid-1',
    title: 'Advanced Moisture Layering for 4C Coils',
    views: '12.5k',
    category: 'Wash Day',
    videoUrl: 'https://www.youtube.com/embed/l89A48GZJ7c',
    thumbnailUrl: 'https://images.unsplash.com/photo-1608139556157-196be06511fc?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: true,
    featuredOrder: 1,
    viewsCount: 12500,
    likesCount: 1420,
    savesCount: 840,
    sharesCount: 310,
    commentsCount: 45,
    shopClicks: 950,
    productAddClicks: 180,
    ebookAddClicks: 120,
    conversionCount: 48
  },
  {
    id: 'vid-2',
    title: 'Precision Bantu Knots: Step-by-Step',
    views: '8.2k',
    category: 'Styling',
    videoUrl: 'https://www.youtube.com/embed/gW7O48r0LzY',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430f33?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: true,
    featuredOrder: 2,
    viewsCount: 8200,
    likesCount: 980,
    savesCount: 430,
    sharesCount: 180,
    commentsCount: 28,
    shopClicks: 620,
    productAddClicks: 110,
    ebookAddClicks: 65,
    conversionCount: 22
  },
  {
    id: 'vid-3',
    title: 'Scalp Stimulation for Length Retention',
    views: '24.1k',
    category: 'Growth Tips',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-washing-her-hair-in-the-shower-42206-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 24100,
    likesCount: 3120,
    savesCount: 1980,
    sharesCount: 820,
    commentsCount: 112,
    shopClicks: 2100,
    productAddClicks: 430,
    ebookAddClicks: 0,
    conversionCount: 85
  },
  {
    id: 'vid-4',
    title: 'Goddess Braids: Tension-Free Install',
    views: '15.9k',
    category: 'Protective Styles',
    videoUrl: 'https://www.tiktok.com/@coilyhaircare/video/737839182903',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595959183075-c1d09e771481?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: true,
    featuredOrder: 3,
    viewsCount: 15900,
    likesCount: 1840,
    savesCount: 1150,
    sharesCount: 420,
    commentsCount: 78,
    shopClicks: 1320,
    productAddClicks: 250,
    ebookAddClicks: 0,
    conversionCount: 54
  },
  {
    id: 'vid-5',
    title: 'Cornrow Base Under Wig Quick Method',
    views: '9.4k',
    category: 'Cornrows',
    videoUrl: 'https://www.youtube.com/embed/SND6WpGoM7Q',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 9400,
    likesCount: 1100,
    savesCount: 680,
    sharesCount: 210,
    commentsCount: 31,
    shopClicks: 490,
    productAddClicks: 95,
    ebookAddClicks: 0,
    conversionCount: 18
  },
  {
    id: 'vid-6',
    title: 'How to Treat Scalp Dryness Instantly',
    views: '11.1k',
    category: 'Growth Tips',
    videoUrl: 'https://www.youtube.com/embed/W9lOAnM64kU',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 11100,
    likesCount: 1350,
    savesCount: 790,
    sharesCount: 290,
    commentsCount: 52,
    shopClicks: 880,
    productAddClicks: 140,
    ebookAddClicks: 90,
    conversionCount: 35
  }
];

export const initialGallery: PhotoGalleryItem[] = [
  {
    id: 'gal-1',
    image: 'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=600',
    caption: '3 Month length retention & moisture level results using the Botanical Growth Oil nightly.',
    category: 'Progress'
  },
  {
    id: 'gal-2',
    image: 'https://images.unsplash.com/photo-1551601651-261bd647ef2e?auto=format&fit=crop&q=80&w=600',
    caption: 'Defined micro-coils after our signature Wash Day Mastery sequence.',
    category: 'Routines'
  },
  {
    id: 'gal-3',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
    caption: 'Deep follicular scalp massage to refresh natural cuticles and promote follicular health.',
    category: 'Progress'
  },
  {
    id: 'gal-4',
    image: 'https://images.unsplash.com/photo-1595959183075-c1d09e771481?auto=format&fit=crop&q=80&w=600',
    caption: 'Symmetrical, geometric feed-in cornrows styled with zero synthetic hair tension.',
    category: 'Hairstyles'
  },
  {
    id: 'gal-5',
    image: '/hero-portrait.jpg',
    caption: 'Healthy, fluffy 4C shape styled on a sunny autumn weekend.',
    category: 'Lifestyle'
  },
  {
    id: 'gal-6',
    image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&q=80&w=600',
    caption: 'The Detangling Collection in action detailing coiled strands with zero pulling.',
    category: 'Routines'
  }
];

export const initialBlogPosts: BlogPost[] = [
  {
    id: 'post-1',
    title: 'The Real Reason Fine 4C Hair Doesn’t Retain Length',
    excerpt: 'It’s not because your hair isn’t growing. Let us explore the core physics of low hair porosity, mechanical tension, and split end retention.',
    content: `Many women inside the 4C hair community believe that their hair stands still and refuse to grow. This is actually a physiological myth. Your scalp hair grows approximately half an inch per month. The actual bottleneck is always **length retention**.

In this article, we dive deep into the real reasons for active breakage:
1. **Under-Hydrated Elasticity**: High-density 4C hair twists and loops at very sharp degrees. Without precise daily sealing of moisture, these loops dry out and chip off like dry twigs during standard detangling.
2. **Mechanical Friction**: Sleeping on cotton pillowcases, dragging traditional fine-tooth combs, and excessive high-tension buns are the primary culprits behind daily micro-tears.
3. **The Chemist’s Mistake**: Using heavy waxes and jellies that block out moisture molecules from penetrating the hair shaft.

### The Optimal Recovery Routine:
Start applying are Botanical Growth Oil to damp strands. Damp hair holds water molecules, which are then enveloped and locked in by the lipid acids in Rosehip and Argan oils inside the bottle. Repeat this sequence every two days!`,
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1608139556157-196be06511fc?auto=format&fit=crop&q=80&w=800',
    date: '2026-06-02',
    category: 'Growth Tips',
    likes: 247
  },
  {
    id: 'post-2',
    title: 'A Hair Chemist’s Deep-Dive Into Pre-Pooing 4C Coils',
    excerpt: 'Pre-shampooing is non-negotiable for fragile cuticles. Learn how utilizing plant oils before water contact prevents hygral fatigue.',
    content: `When hair is fully saturated with water during a wash, the cortex swells up. When it dries, it contracts back. For fragile 4C strands, this infinite swell-and-contract cycle (known as **hygral fatigue**) causes severe structural damage over time.

A 'pre-poo' acts as a chemical cushion:
* **Cellular Hydrophobic Shield**: Coats the cuticles, stopping water from rushing in too rapidly.
* **Tangle Melt**: Lubricate tight coils so shed strands slide out cleanly before you apply shampoo.
* **Oil Recommendation**: Use Coconut, Avocado, or our **Botanical Growth Oil** saturated onto dry hair for at least 30 minutes before washing.

Try this simple change next wash day and see how much less hair you shed in the shower!`,
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    date: '2026-05-28',
    category: 'Wash Day',
    likes: 184
  }
];

export const initialDiscountCodes: DiscountCode[] = [
  {
    id: 'disc-1',
    code: 'GROW4C',
    discountPercent: 15,
    isActive: true,
    description: '15% Off Your Entire Cart for Hair Growth Day!'
  },
  {
    id: 'disc-2',
    code: 'CARTIAE10',
    discountPercent: 10,
    isActive: true,
    description: '10% Fan Welcome Discount'
  }
];

export const initialHomepageContent: HomepageContent = {
  heroHeadline: 'Healthy 4C Hair Starts With the Right Routine',
  heroSubheadline: 'Learn simple, real, and effective hair care routines from Cartiae Rae — built for short, fine, natural 4C hair.',
  aboutHeadline: 'Relatable, Natural & Proven 4C Solutions',
  aboutStory: 'For years, I believed my tightly coiled 4C hair was destined to stay dry, short, and difficult to manage. I was constantlly told that length was impossible for our texture. But through rigorous research, hydration protocols, and simple breakage-prevention methods, I cracked the code to healthy retention. Now, my goal is to hand you the exact master tools, eBooks, and botanical formulas to make your hair care simple, therapeutic, and deeply rewarding.',
  promoQuote: 'Cartiae’s methods are a game changer. My hair has never felt this soft or looked this healthy. The eBooks are incredibly detailed and the oil smells heavenly!',
  promoAuthor: 'Maya J., Loyal Customer'
};
