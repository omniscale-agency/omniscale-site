'use client';
import { motion } from 'framer-motion';
import { ArrowUpRight, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { BOOKING_URL, CONTACT_EMAIL } from '@/lib/config';

export default function Contact() {
  return (
    <section id="contact" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-lilac/10 blur-[150px]" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">On bosse ensemble ?</span>
            <div className="w-12 h-px bg-lilac" />
          </div>

          <h2 className="font-display text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-10">
            Parle-nous de <br />
            <span className="text-gradient">ton projet.</span>
          </h2>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
            Audit offert, sans engagement. On te dit franchement si on peut t'aider — et comment.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-3 bg-lilac text-ink font-semibold px-10 py-5 rounded-full text-lg hover:bg-white transition-colors"
            >
              <Calendar size={22} /> Réserver un appel gratuit (45 min)
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-3 text-white border border-white/20 hover:border-lilac hover:text-lilac font-medium px-10 py-5 rounded-full text-lg transition-all"
            >
              {CONTACT_EMAIL} <ArrowUpRight size={20} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/10">
            <div className="flex flex-col items-center gap-3">
              <Mail className="text-lilac" size={22} />
              <div className="text-white/50 text-sm">Email</div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-white hover:text-lilac">{CONTACT_EMAIL}</a>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Phone className="text-lilac" size={22} />
              <div className="text-white/50 text-sm">Téléphone</div>
              <a href="tel:+33000000000" className="text-white hover:text-lilac">+33 (0) — — —</a>
            </div>
            <div className="flex flex-col items-center gap-3">
              <MapPin className="text-lilac" size={22} />
              <div className="text-white/50 text-sm">Bureaux</div>
              <span className="text-white">Paris · Lyon</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
