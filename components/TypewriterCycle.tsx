'use client';
import { useEffect, useState } from 'react';

const WORDS = [
  'tes commerces.',
  'ton business.',
  'ta boutique.',
  'ton restaurant.',
  'ton e-shop.',
  'ta marque.',
];

export default function TypewriterCycle() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pause' | 'deleting'>('typing');

  useEffect(() => {
    const target = WORDS[index];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < target.length) {
        timeout = setTimeout(() => setText(target.slice(0, text.length + 1)), 70);
      } else {
        timeout = setTimeout(() => setPhase('pause'), 1600);
      }
    } else if (phase === 'pause') {
      timeout = setTimeout(() => setPhase('deleting'), 200);
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(target.slice(0, text.length - 1)), 35);
      } else {
        setIndex((i) => (i + 1) % WORDS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [text, phase, index]);

  return (
    <span className="text-gradient inline-block">
      {text}
      <span
        className="inline-block w-[0.08em] h-[0.85em] bg-lilac align-baseline ml-1 -mb-[0.05em]"
        style={{ animation: 'blink 1s step-end infinite' }}
      />
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
