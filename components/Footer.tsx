'use client';
import Logo from './Logo';
import Socials from './Socials';

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-lilac rounded-xl p-1.5">
                <Logo size={28} color="#0a0a12" />
              </div>
              <span className="font-display text-xl font-bold">omniscale</span>
            </div>
            <p className="text-white/60 max-w-md">
              On scale les commerces physiques et e-commerce. Social media, ads,
              sites internet, marketing d'influence.
            </p>
          </div>

          <div>
            <div className="text-white font-semibold mb-4">Navigation</div>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><a href="#services" className="hover:text-lilac">Services</a></li>
              <li><a href="#showreel" className="hover:text-lilac">Showreel</a></li>
              <li><a href="#cas" className="hover:text-lilac">Cas clients</a></li>
              <li><a href="#agence" className="hover:text-lilac">Agence</a></li>
              <li><a href="#faq" className="hover:text-lilac">FAQ</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold mb-4">Suivez-nous</div>
            <Socials size="sm" />
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <div>© {new Date().getFullYear()} Omniscale — Tous droits réservés.</div>
          <div className="flex flex-wrap gap-6">
            <a href="/mentions-legales" className="hover:text-lilac">Mentions légales</a>
            <a href="/cgu" className="hover:text-lilac">CGU</a>
            <a href="/confidentialite" className="hover:text-lilac">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
