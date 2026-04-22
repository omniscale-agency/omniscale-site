export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-lilac animate-spin" />
        <div className="text-xs uppercase tracking-widest text-white/40">Chargement…</div>
      </div>
    </div>
  );
}
