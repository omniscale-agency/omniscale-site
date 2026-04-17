'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { BOOKING_URL } from '@/lib/config';

const links = [
  { href: '#services', label: 'Services' },
  { href: '#showreel', label: 'Showreel' },
  { href: '#cas', label: 'Cas clients' },
  { href: '#process', label: 'Process' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-ink/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3 group">
            <div className="bg-lilac rounded-xl p-1.5 group-hover:rotate-12 transition-transform duration-500">
              <Logo size={28} color="#0a0a12" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">omniscale</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-white/70 hover:text-lilac transition-colors relative group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-lilac group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex btn-shine items-center gap-2 bg-lilac text-ink font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-white transition-colors"
          >
            Réserver un appel
          </a>

          <button onClick={() => setOpen(true)} className="md:hidden text-white" aria-label="Menu">
            <Menu size={28} />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink md:hidden"
          >
            <div className="flex items-center justify-between p-6">
              <span className="font-display text-xl font-bold">omniscale</span>
              <button onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={28} />
              </button>
            </div>
            <nav className="flex flex-col gap-6 px-8 mt-12">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="font-display text-4xl font-bold hover:text-lilac transition-colors"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
