export const stokBadge = (s) =>
  s === 0
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
    : s < 10
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';