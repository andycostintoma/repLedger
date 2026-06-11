export const muscleTone = (muscle: string) => {
  const key = muscle.toLowerCase();

  if (key.includes('quad') || key.includes('calf')) return 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20';
  if (key.includes('glute') || key.includes('ham')) return 'bg-fuchsia-400/15 text-fuchsia-200 ring-fuchsia-300/20';
  if (key.includes('abs') || key.includes('forearm')) return 'bg-amber-400/15 text-amber-200 ring-amber-300/20';
  if (key.includes('trap') || key.includes('back') || key.includes('lat')) return 'bg-cyan-400/15 text-cyan-200 ring-cyan-300/20';

  return 'bg-slate-700 text-slate-200 ring-white/10';
};
