export const stokBadge = (s) =>
  s === 0
    ? 'badge-muted'
    : s < 10
    ? 'badge-primary'
    : 'badge-accent';