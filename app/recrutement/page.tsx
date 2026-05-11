'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, ArrowLeft, Sparkles, Zap, Users, Rocket } from 'lucide-react';
import Cursor from '@/components/Cursor';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const POSITIONS = [
  'Closer (vente high-ticket)',
  'Setter (qualification leads)',
  'Media buyer (Meta / TikTok / Google)',
  'Vidéaste / Monteur',
  'Designer / Motion designer',
  'Account manager',
  'Développeur web',
  'Stage / Alternance',
  'Candidature spontanée',
];

export default function RecrutementPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!name.trim() || !email.trim() || !position || !message.trim()) {
      setStatus({ type: 'err', msg: 'Merci de remplir tous les champs obligatoires (nom, email, poste, message).' });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const r = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'recruitment_application',
          to: 'omniscale1@gmail.com',
          data: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            position,
            portfolio: portfolio.trim(),
            message: message.trim(),
          },
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setStatus({ type: 'err', msg: j.error || `Erreur ${r.status}. Réessaie ou écris-nous direct à contact@omniscale.fr.` });
      } else {
        setStatus({ type: 'ok', msg: 'Candidature envoyée ! On revient vers toi sous 5 jours ouvrés.' });
        setName(''); setEmail(''); setPhone(''); setPosition(''); setPortfolio(''); setMessage('');
      }
    } catch (e: any) {
      setStatus({ type: 'err', msg: e?.message || 'Erreur réseau. Réessaie ou écris-nous direct à contact@omniscale.fr.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="relative">
      <Cursor />
      <Nav />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-black">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-omni-700/15 blur-[160px]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full bg-lilac/8 blur-[180px]"
          />
          <div className="absolute inset-0 halftone opacity-20" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-lilac text-sm mb-10 transition-colors"
          >
            <ArrowLeft size={14} /> Retour à l'accueil
          </a>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start"
          >
            {/* Colonne gauche : pitch */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lilac/30 bg-lilac/5 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-white/80">On recrute en continu</span>
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.95] tracking-tighter mb-8">
                Rejoindre <br />
                <span className="text-gradient">Omniscale.</span>
              </h1>

              <div className="space-y-5 text-lg text-white/70 leading-relaxed mb-10">
                <p>
                  On est une agence française qui scale les commerces physiques et e-commerce
                  via social media, ads, sites internet et marketing d'influence. Pas une
                  usine à clients : on prend 5 commerces par trimestre et on s'investit
                  comme si c'était le nôtre.
                </p>
                <p>
                  Notre culture : <strong className="text-white">zéro bullshit</strong>, ownership total,
                  résultats mesurables. On ne recrute pas des CV, on recrute des gens qui veulent
                  scaler des business avec nous et qui prennent leur taf au sérieux.
                </p>
                <p>
                  Que tu sois closer, media buyer, vidéaste, designer, dev, ou que tu veuilles
                  juste candidater spontanément — si t'as envie de te casser le cul sur des
                  vrais projets et d'apprendre vite, balance-nous ta candidature.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Perk Icon={Zap} label="Cadence rapide" sub="On bouge vite, on teste vite" />
                <Perk Icon={Users} label="Équipe à taille humaine" sub="5 personnes, pas 500" />
                <Perk Icon={Rocket} label="Vrais résultats" sub="Tu vois ton impact direct" />
                <Perk Icon={Sparkles} label="Outils modernes" sub="IA, automatisation, no-bullshit" />
              </div>
            </div>

            {/* Colonne droite : formulaire */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur p-6 md:p-8 lg:sticky lg:top-28"
            >
              <h2 className="font-display text-2xl font-bold mb-2">Ta candidature</h2>
              <p className="text-sm text-white/50 mb-6">
                Réponse sous 5 jours ouvrés à l'email que tu fournis.
              </p>

              <form onSubmit={submit} className="space-y-4">
                <Field label="Nom complet *" htmlFor="name">
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="input"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email *" htmlFor="email">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jean@email.com"
                      className="input"
                    />
                  </Field>
                  <Field label="Téléphone" htmlFor="phone">
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="input"
                    />
                  </Field>
                </div>

                <Field label="Poste recherché *" htmlFor="position">
                  <select
                    id="position"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="input"
                  >
                    <option value="">— Sélectionne un poste —</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Lien LinkedIn / Portfolio / CV (Drive, Notion…)" htmlFor="portfolio">
                  <input
                    id="portfolio"
                    type="url"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://linkedin.com/in/…"
                    className="input"
                  />
                </Field>

                <Field label="Pourquoi tu nous rejoins ? *" htmlFor="message">
                  <textarea
                    id="message"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Parle-nous de toi en quelques lignes : ce que tu sais faire, ce qui te motive, et un truc concret dont tu es fier."
                    rows={6}
                    className="input resize-none"
                  />
                </Field>

                {status && (
                  <div
                    className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${
                      status.type === 'ok'
                        ? 'border-green-500/30 bg-green-500/10 text-green-300'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {status.type === 'ok' ? (
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    )}
                    <span>{status.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold px-6 py-3.5 rounded-full text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Envoi…' : (
                    <>
                      <Send size={14} /> Envoyer ma candidature
                    </>
                  )}
                </button>

                <p className="text-xs text-white/40 text-center">
                  Envoie direct à <strong className="text-white/60">omniscale1@gmail.com</strong>.
                  Tes données ne sont pas stockées — juste l'email transmis à l'équipe.
                </p>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: rgba(183, 148, 232, 0.5);
        }
        .input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Perk({
  Icon,
  label,
  sub,
}: {
  Icon: typeof Zap;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <Icon className="text-lilac mb-2" size={18} />
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-xs text-white/50 mt-0.5">{sub}</div>
    </div>
  );
}
