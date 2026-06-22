import { EBook, Product, TikTokVideo, PhotoGalleryItem, BlogPost, DiscountCode, HomepageContent, Service } from '../types';

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
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-combing-her-hair-in-a-beauty-salon-42219-large.mp4',
    thumbnailUrl: '/about-portrait.jpg',
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
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-styling-her-natural-hair-at-home-42223-large.mp4',
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
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-applying-products-to-her-hair-42220-large.mp4',
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
    category: 'Protective Styles',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-taking-selfie-with-a-mobile-phone-1286-large.mp4',
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
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-washing-her-hair-in-the-shower-42206-large.mp4',
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
  },
  {
    id: 'vid-7',
    title: 'How to Lock in Moisture on 4C Ends',
    views: '18.3k',
    category: 'Wash Day',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7649020810828451085',
    thumbnailUrl: '/about-portrait.jpg',
    status: 'published',
    isFeatured: false,
    viewsCount: 18300,
    likesCount: 2200,
    savesCount: 1350,
    sharesCount: 520,
    commentsCount: 78,
    shopClicks: 1450,
    productAddClicks: 210,
    ebookAddClicks: 130,
    conversionCount: 62
  },
  {
    id: 'vid-8',
    title: 'The Best 4C Scalp Massage Technique',
    views: '14.2k',
    category: 'Growth Tips',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7645684103118949662',
    thumbnailUrl: '/hero-portrait.jpg',
    status: 'published',
    isFeatured: false,
    viewsCount: 14200,
    likesCount: 1680,
    savesCount: 980,
    sharesCount: 420,
    commentsCount: 56,
    shopClicks: 920,
    productAddClicks: 150,
    ebookAddClicks: 80,
    conversionCount: 44
  },
  {
    id: 'vid-9',
    title: 'Simple 4C Wash Day Routine Layout',
    views: '9.5k',
    category: 'Wash Day',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7644948360226475278',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430f33?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 9500,
    likesCount: 1100,
    savesCount: 640,
    sharesCount: 280,
    commentsCount: 38,
    shopClicks: 710,
    productAddClicks: 110,
    ebookAddClicks: 60,
    conversionCount: 30
  },
  {
    id: 'vid-10',
    title: 'Protective Styling 101: Zero Edge Tension',
    views: '21.6k',
    category: 'Protective Styles',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7643470256295431438',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595959183075-c1d09e771481?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 21600,
    likesCount: 2950,
    savesCount: 1840,
    sharesCount: 780,
    commentsCount: 104,
    shopClicks: 1980,
    productAddClicks: 320,
    ebookAddClicks: 0,
    conversionCount: 74
  },
  {
    id: 'vid-11',
    title: 'Botanical Growth Oil Scaling Results',
    views: '32.4k',
    category: 'Growth Tips',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7640207145715191054',
    thumbnailUrl: '/about-portrait.jpg',
    status: 'published',
    isFeatured: false,
    viewsCount: 32400,
    likesCount: 4200,
    savesCount: 2790,
    sharesCount: 1120,
    commentsCount: 189,
    shopClicks: 3100,
    productAddClicks: 580,
    ebookAddClicks: 190,
    conversionCount: 145
  },
  {
    id: 'vid-12',
    title: 'Protective Style Foundation',
    views: '11.8k',
    category: 'Protective Styles',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7628994030386334989',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 11800,
    likesCount: 1250,
    savesCount: 780,
    sharesCount: 310,
    commentsCount: 42,
    shopClicks: 840,
    productAddClicks: 130,
    ebookAddClicks: 0,
    conversionCount: 35
  },
  {
    id: 'vid-13',
    title: 'Coily Low Porosity Regimen Map',
    views: '16.7k',
    category: 'Styling',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7625647414438874381',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 16700,
    likesCount: 1890,
    savesCount: 1120,
    sharesCount: 480,
    commentsCount: 76,
    shopClicks: 1290,
    productAddClicks: 220,
    ebookAddClicks: 110,
    conversionCount: 58
  },
  {
    id: 'vid-14',
    title: 'Hydrating Scalp Spray Demonstration',
    views: '10.4k',
    category: 'Growth Tips',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7605257896565148959',
    thumbnailUrl: '/hero-portrait.jpg',
    status: 'published',
    isFeatured: false,
    viewsCount: 10400,
    likesCount: 1050,
    savesCount: 620,
    sharesCount: 220,
    commentsCount: 34,
    shopClicks: 650,
    productAddClicks: 90,
    ebookAddClicks: 40,
    conversionCount: 25
  },
  {
    id: 'vid-15',
    title: 'Deep Conditioner Application Secrets',
    views: '15.1k',
    category: 'Wash Day',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7598951455256579341',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430f33?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 15100,
    likesCount: 1720,
    savesCount: 1020,
    sharesCount: 410,
    commentsCount: 65,
    shopClicks: 1150,
    productAddClicks: 180,
    ebookAddClicks: 95,
    conversionCount: 50
  },
  {
    id: 'vid-16',
    title: 'Scalp Health and Oil Sealing Secrets',
    views: '23.9k',
    category: 'Growth Tips',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7593389946434637070',
    thumbnailUrl: '/about-portrait.jpg',
    status: 'published',
    isFeatured: false,
    viewsCount: 23900,
    likesCount: 3100,
    savesCount: 1980,
    sharesCount: 840,
    commentsCount: 112,
    shopClicks: 2300,
    productAddClicks: 410,
    ebookAddClicks: 150,
    conversionCount: 95
  },
  {
    id: 'vid-17',
    title: 'Detangling Curly Hair with Zero Friction',
    views: '19.5k',
    category: 'Styling',
    videoUrl: 'https://www.tiktok.com/@cartiaerae/video/7591897939094670647',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&q=80&w=400',
    status: 'published',
    isFeatured: false,
    viewsCount: 19500,
    likesCount: 2400,
    savesCount: 1560,
    sharesCount: 610,
    commentsCount: 82,
    shopClicks: 1680,
    productAddClicks: 280,
    ebookAddClicks: 0,
    conversionCount: 68
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
    category: 'Hairstyles'
  },
  {
    id: 'gal-6',
    image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&q=80&w=600',
    caption: 'The Detangling Collection in action detailing coiled strands with zero pulling.',
    category: 'Routines'
  },
  {
    id: 'gal-7',
    image: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&q=80&w=600',
    caption: 'Defined coily puff with hydrated edges styled for a premium weekend event.',
    category: 'Hairstyles'
  },
  {
    id: 'gal-8',
    image: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&q=80&w=600',
    caption: 'Polished high-contrast twist-out results showing extreme curl definition.',
    category: 'Hairstyles'
  },
  {
    id: 'gal-9',
    image: '/our-story.jpeg',
    caption: 'Morning hydration routine checking coils and styling self-care habits.',
    category: 'Routines'
  },
  {
    id: 'gal-10',
    image: '/about-portrait.jpg',
    caption: 'Founder Cartiae Rae showcasing daily moisturized, bouncy natural 4C coils.',
    category: 'Progress'
  },
  {
    id: 'gal-11',
    image: '/lookbook-1.jpg',
    caption: 'Classic straight-back feed-in cornrows highlighting neat parting and clean protective style symmetry.',
    category: 'Hairstyles'
  },
  {
    id: 'gal-12',
    image: '/lookbook-2.jpg',
    caption: 'Side-profile twist braid detailing with silver hoop accents for a sleek, contemporary protective look.',
    category: 'Hairstyles'
  },
  {
    id: 'gal-13',
    image: '/lookbook-3.jpg',
    caption: 'Elegant cornrow patterns and styled braids paired with golden jewelry accents for a premium finish.',
    category: 'Hairstyles'
  },
  {
    id: 'gal-14',
    image: '/lookbook-4.jpg',
    caption: 'Bouncy, healthy natural Afro growth showing extreme shape retention and carefully styled baby hair edges.',
    category: 'Progress'
  },
  {
    id: 'gal-15',
    image: '/lookbook-5.jpg',
    caption: 'Short, defined natural curls exhibiting rich luster, balanced moisture density, and gold accessory framing.',
    category: 'Progress'
  },
  {
    id: 'gal-16',
    image: '/lookbook-6.jpg',
    caption: 'Active lather foaming during our Botanical Shampoo wash sequence to clarify natural cuticles.',
    category: 'Routines'
  },
  {
    id: 'gal-17',
    image: '/lookbook-7.jpg',
    caption: 'Dividing natural hair into chunky sections to optimize moisture distribution and ease tension.',
    category: 'Routines'
  },
  {
    id: 'gal-18',
    image: '/lookbook-8.jpg',
    caption: 'A gorgeous, defined twist-out style revealing incredible volume and springy natural 4C curl shape.',
    category: 'Hairstyles'
  },
  {
    id: 'gal-19',
    image: '/lookbook-9.jpg',
    caption: 'Stretching and detangling fine 4C coils using our wide-tooth pick sequence to prevent knotting.',
    category: 'Routines'
  },
  {
    id: 'gal-20',
    image: '/lookbook-10.jpg',
    caption: 'Cuticle moisture saturation check showing shiny, hydrated coil patterns fresh after conditioning.',
    category: 'Progress'
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
    image: '/about-portrait.jpg',
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
  heroImageUrl: '/hero-portrait.jpg',
  aboutHeadline: 'Relatable, Natural & Proven 4C Solutions',
  aboutStory: 'For years, I believed my tightly coiled 4C hair was destined to stay dry, short, and difficult to manage. I was constantly told that length was impossible for our texture. But through rigorous research, hydration protocols, and simple breakage-prevention methods, I cracked the code to healthy retention. Now, my goal is to hand you the exact master tools, eBooks, and botanical formulas to make your hair care simple, therapeutic, and deeply rewarding.',
  aboutImageUrl: '/about-portrait.jpg',
  promoQuote: 'Cartiae’s methods are a game changer. My hair has never felt this soft or looked this healthy. The eBooks are incredibly detailed and the oil smells heavenly!',
  promoAuthor: 'Maya J., Loyal Customer'
};

export const initialServices: Service[] = [
  {
    id: 'service-1',
    name: 'Hair Assessment Guidance Call',
    price: 100.00,
    image: 'https://images.unsplash.com/photo-1595959183075-c1d0a5113cc3?auto=format&fit=crop&q=80&w=800',
    description: 'This one-hour personalized session provides an assessment of the client\'s hair, routine, and growth challenges. It complements the "31 Days to Success" eBook by helping clients understand their hair needs, proper products, daily routines, and long-term healthy growth strategies.',
    included: ['Introduction & Hair Assessment', 'Identify Hair Goals', 'Establish Hair Routine', 'Long-Term Hair Strategy'],
    benefits: ['Personalized recap', 'Additional tools/templates', 'Option for discounted follow-up coaching'],
    notice: ['Confirmation may take up to 24 hours', 'High-risk purchases may require verification', 'Meeting link delivered by email', 'Correct email address required'],
    disclaimer: 'This is a virtual consultation. Not a physical product. All digital purchases are non-refundable.'
  },
  {
    id: 'service-2',
    name: 'Social Media Growth Coaching Call',
    price: 100.00,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    description: 'A one-hour strategy session focused on social media growth, branding, and content strategy. Topics include content review, growth obstacles, personalized roadmap, visibility strategy, and consistency planning.',
    included: ['Goal setting', 'Brand & niche identification', 'Content pillars', 'Long-term growth strategy'],
    benefits: ['Personalized recap', 'Templates and resources', 'Optional follow-up coaching'],
    notice: ['Confirmation within 24 hours', 'High-risk purchases may require verification', 'Meeting link sent by email'],
    disclaimer: 'Virtual consultation only. Not a physical product. Digital purchases are non-refundable.'
  }
];
