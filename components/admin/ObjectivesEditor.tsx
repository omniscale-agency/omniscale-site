'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, Check, X, Pencil, Trophy } from 'lucide-react';
import {
  fetchObjectives, addObjective, updateObjective, deleteObjective,
  subscribeObjectives, Objective,
} from '@/lib/objectivesStore';
import Card from '@/components/dashboard/Card';

const UNITS = ['€', '%', '', 'k', 'RDV', 'abonnés', 'ventes', 'commandes', 'leads', 'vues'];

export default function ObjectivesEditor({ slug }: { slug: string }) {
  const [items, setItems] = useState<Objective[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const refresh = async () => setItems(await fetchObjectives(slug));
    refresh();
    return subscribeObjectives(slug, refresh);
  }, [slug]);

  return (
    <Card title="Objectifs trimestriels" icon={Target} subtitle={`${items.length} objectif(s) — visibles côté client`}>
      <div className="space-y-3">
        {items.length === 0 && !adding && (
          <div className="text-sm text-white/50 italic py-4 text-center">
            Aucun objectif défini. Le client verra une page vide.
          </div>
        )}

        {items.map((o) => (
          editingId === o.id ? (
            <ObjectiveForm
              key={o.id}
              initial={o}
              onCancel={() => setEditingId(null)}
              onSave={async (patch) => {
                await updateObjective(o.id, patch);
                setEditingId(null);
              }}
            />
          ) : (
            <ObjectiveRow
              key={o.id}
              obj={o}
              onEdit={() => setEditingId(o.id)}
              onDelete={async () => {
                if (!confirm(`Supprimer l'objectif "${o.label}" ?`)) return;
                await deleteObjective(o.id);
              }}
              onProgress={async (delta) => {
                const next = Math.max(0, o.current + delta);
                await updateObjective(o.id, { current: next });
              }}
            />
          )
        ))}

        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ObjectiveForm
                onCancel={() => setAdding(false)}
                onSave={async (patch) => {
                  await addObjective(slug, {
                    label: patch.label || 'Nouvel objectif',
                    current: patch.current ?? 0,
                    target: patch.target ?? 1,
                    unit: patch.unit ?? '',
                  });
                  setAdding(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full inline-flex items-center justify-center gap-2 text-sm bg-lilac/10 border border-dashed border-lilac/30 text-lilac py-3 rounded-xl hover:bg-lilac/20 hover:border-lilac/50 transition-colors"
          >
            <Plus size={14} /> Ajouter un objectif
          </button>
        )}
      </div>
    </Card>
  );
}

function ObjectiveRow({
  obj, onEdit, onDelete, onProgress,
}: {
  obj: Objective;
  onEdit: () => void;
  onDelete: () => void;
  onProgress: (delta: number) => Promise<void>;
}) {
  const pct = Math.min(100, Math.round((obj.current / Math.max(1, obj.target)) * 100));
  const reached = pct >= 100;
  const fmtVal = (n: number) => obj.unit === '€'
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
    : `${n}${obj.unit ? ' ' + obj.unit : ''}`;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {reached ? <Trophy size={14} className="text-green-400 shrink-0" /> : <Target size={14} className="text-lilac shrink-0" />}
          <div className="font-medium text-sm truncate">{obj.label}</div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white" title="Modifier">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400" title="Supprimer">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-white/60">
          <span className="text-white font-mono">{fmtVal(obj.current)}</span>
          <span className="text-white/40"> / {fmtVal(obj.target)}</span>
        </span>
        <span className={`font-mono ${reached ? 'text-green-400' : 'text-lilac'}`}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${reached ? 'bg-green-400' : 'bg-gradient-to-r from-lilac to-omni-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-1">
        {[-10, -1, +1, +10].map((d) => (
          <button
            key={d}
            onClick={() => onProgress(d)}
            className="flex-1 text-[11px] py-1 rounded-md bg-white/5 hover:bg-lilac/20 hover:text-lilac border border-white/5 text-white/50"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}

function ObjectiveForm({
  initial, onCancel, onSave,
}: {
  initial?: Partial<Objective>;
  onCancel: () => void;
  onSave: (patch: Partial<Omit<Objective, 'id'>>) => Promise<void>;
}) {
  const [label, setLabel] = useState(initial?.label || '');
  const [current, setCurrent] = useState(initial?.current ?? 0);
  const [target, setTarget] = useState(initial?.target ?? 100);
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || target <= 0) return;
    setBusy(true);
    try {
      await onSave({ label: label.trim(), current, target, unit });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-lilac/30 bg-lilac/5 p-4 space-y-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Ex: CA mensuel TikTok Shop"
        autoFocus
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-lilac/50 text-sm"
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Actuel</label>
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-lilac/50 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Cible</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
            min={0}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-lilac/50 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Unité</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-lilac/50 text-sm"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u || '— aucune —'}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !label.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold py-2 rounded-lg text-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          <Check size={14} /> Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
        >
          <X size={14} />
        </button>
      </div>
    </form>
  );
}
