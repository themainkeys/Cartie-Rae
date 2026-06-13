import React, { useState } from 'react';
import { ShoppingBag, Menu, X, ShieldAlert, Sparkles, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  activePart: string;
  setActivePart: (part: string) => void;
  openCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activePart, setActivePart, openCart }) => {
  const { cart, isAdminLoggedIn } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { label: 'Home', key: 'home' },
    { label: 'Shop Essentials', key: 'shop' },
    { label: 'Watch Tutorials', key: 'tutorials' },
    { label: 'Progress Gallery', key: 'gallery' },
    { label: 'Our Story', key: 'story' },
    { label: 'Contact', key: 'contact' },
  ];

  const handleNavClick = (key: string) => {
    setActivePart(key);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Top Banner Accent with simple wording */}
      <div className="bg-brand-beige text-brand-dark text-[10px] uppercase tracking-[0.25em] py-2 px-4 text-center font-sans font-medium border-b border-brand-warm-tan/30 select-none">
        <span>Enjoy 15% off with code <strong className="font-bold">GROW4C</strong> • Instant download on all eBooks</span>
      </div>

      <header className="sticky top-0 z-40 bg-brand-cream/90 backdrop-blur-md border-b border-brand-warm-tan/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Mobile Navigation Layout */}
          <div className="flex items-center justify-between h-20 md:hidden relative">
            
            {/* LEFT SIDE: Minimal Hamburger Menu Toggle */}
            <div className="flex w-1/4 justify-start items-center">
              <button
                id="menu-toggle-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-brand-dark hover:text-brand-rose focus:outline-none flex items-center gap-2 transition-colors py-1 group"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5 stroke-[1.5]" />
                <span className="hidden sm:inline font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-brand-dark/70 group-hover:text-brand-rose transition-colors mt-0.5">
                  Menu
                </span>
              </button>
            </div>

            {/* ABSOLUTE CENTER: Simplified Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center">
              <button
                id="brand-logo-btn-mobile"
                onClick={() => handleNavClick('home')}
                className="group flex flex-col items-center text-center focus:outline-none"
              >
                <span className="font-serif text-xl sm:text-2xl tracking-normal text-brand-dark group-hover:text-brand-rose transition-colors duration-300">
                  Cartiae Rae
                </span>
                <span className="font-sans text-[8px] uppercase tracking-[0.25em] text-brand-dark/40 mt-1 sm:mt-1.5 transition-colors group-hover:text-brand-rose/60">
                  Hair Education
                </span>
              </button>
            </div>

            {/* RIGHT SIDE: Action Area */}
            <div className="flex w-1/4 justify-end space-x-3 items-center">
              <button
                id="admin-nav-trigger-mobile"
                onClick={() => handleNavClick('admin')}
                className={`${isAdminLoggedIn ? 'text-brand-rose' : 'text-brand-dark/40 hover:text-brand-rose'} p-1.5 transition-colors focus:outline-none`}
                title={isAdminLoggedIn ? "Admin Dashboard" : "Staff Portal Login"}
                aria-label="Staff Access Portal"
              >
                <Lock className="w-4 h-4 stroke-[1.5]" />
              </button>

              {/* Shopping Cart Trigger */}
              <button
                id="cart-trigger-btn-mobile"
                onClick={openCart}
                className="relative p-2 text-brand-dark hover:text-brand-rose transition-colors duration-300 flex items-center justify-center focus:outline-none"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-4.5 h-4.5 text-brand-dark stroke-[1.5]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-rose text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* New Desktop Editorial Layout (Directly access pages) */}
          <div className="hidden md:flex items-center justify-between h-20 w-full">
            {/* Left Brand Logo */}
            <button
              id="brand-logo-btn-desktop"
              onClick={() => handleNavClick('home')}
              className="flex flex-col items-start text-left focus:outline-none group animate-none"
            >
              <span className="font-serif text-xl sm:text-2xl tracking-normal text-brand-dark group-hover:text-brand-rose transition-colors duration-300">
                Cartiae Rae
              </span>
              <span className="font-sans text-[8px] uppercase tracking-[0.25em] text-brand-dark/40 mt-0.5 transition-colors group-hover:text-brand-rose/60">
                Hair Education
              </span>
            </button>

            {/* Middle Nav Items */}
            <nav className="flex items-center gap-6 lg:gap-8">
              {navItems.map((item) => {
                const isActive = activePart === item.key;
                return (
                  <button
                    key={item.key}
                    id={`desktop-nav-${item.key}`}
                    onClick={() => handleNavClick(item.key)}
                    className={`text-[10px] font-medium uppercase tracking-[0.2em] relative py-1 focus:outline-none transition-colors duration-300 bg-transparent ${
                      isActive ? 'text-brand-rose font-semibold bg-transparent' : 'text-brand-dark/70 hover:text-brand-dark bg-transparent'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-[-4px] left-0 right-[-2px] h-[1.5px] bg-brand-rose animate-none" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <button
                id="admin-nav-trigger-desktop"
                onClick={() => handleNavClick('admin')}
                className={`${isAdminLoggedIn ? 'text-brand-rose' : 'text-brand-dark/40 hover:text-brand-rose'} p-1.5 transition-colors focus:outline-none`}
                title={isAdminLoggedIn ? "Admin Dashboard" : "Staff Portal Login"}
                aria-label="Staff Access Portal"
              >
                <Lock className="w-4 h-4 stroke-[1.5]" />
              </button>

              {/* Shopping Cart Trigger */}
              <button
                id="cart-trigger-btn-desktop"
                onClick={openCart}
                className="relative p-2 text-brand-dark hover:text-brand-rose transition-colors duration-300 flex items-center justify-center focus:outline-none cursor-pointer"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-4.5 h-4.5 text-brand-dark stroke-[1.5]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-rose text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-none">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Minimalist Slide-Down/Overlay Menu */}
        {isMenuOpen && (
          <div className="fixed inset-x-0 top-0 h-screen bg-brand-cream/98 z-50 flex flex-col justify-between overflow-y-auto transform transition-all duration-300">
            {/* Overlay Header */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
              <div className="flex items-center justify-between h-20 border-b border-brand-warm-tan/10">
                {/* Close Button on left corresponding to menu position */}
                <button
                  id="menu-close-btn"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-brand-dark hover:text-brand-rose focus:outline-none flex items-center gap-2 transition-colors py-1"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                  <span className="hidden sm:inline font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-brand-dark/70">
                    Close
                  </span>
                </button>

                {/* Logo Centered */}
                <span className="font-serif text-xl sm:text-2xl tracking-normal text-brand-dark select-none absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2">
                  Cartiae Rae
                </span>

                {/* Empty container for symmetry */}
                <div className="w-10 h-10" />
              </div>
            </div>

            {/* Navigation links styled like a luxury editorial table of contents */}
            <div className="max-w-3xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center w-full">
              <div className="space-y-6 sm:space-y-8">
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-brand-rose font-bold block mb-4">
                  Navigation Menu
                </span>
                <nav className="space-y-4 sm:space-y-5">
                  {navItems.map((item, index) => {
                    const isActive = activePart === item.key;
                    return (
                      <button
                        key={item.key}
                        id={`overlay-nav-${item.key}`}
                        onClick={() => handleNavClick(item.key)}
                        className="group flex items-baseline w-full text-left focus:outline-none py-1.5"
                      >
                        <span className="font-mono text-xs text-brand-rose/60 mr-4 tracking-wider select-none">
                          0{index + 1}
                        </span>
                        <span className={`font-serif text-2xl sm:text-3xl tracking-normal transition-all duration-300 ${
                          isActive 
                            ? 'text-brand-rose font-semibold pl-2' 
                            : 'text-brand-dark hover:text-brand-rose hover:pl-2'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Menu Footer */}
            <div className="w-full bg-[#FAF6F0] py-8 border-t border-brand-warm-tan/15 text-center px-6">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#6C5347]/70">
                Cartiae Rae Hair Studio • Healthy Hair Regimens Made Simple
              </p>
              {isAdminLoggedIn ? (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="mt-2 text-[9px] uppercase tracking-widest text-[#B11B41] underline font-semibold focus:outline-none"
                >
                  Go to Admin Panel
                </button>
              ) : (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="mt-2 text-[9px] uppercase tracking-widest text-brand-dark/50 hover:text-brand-rose transition-colors font-sans focus:outline-none"
                >
                  Staff Access
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
