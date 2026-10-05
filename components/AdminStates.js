export function LoadingState({ label = 'Memuat data...' }) {
  return <div className="card p-5 text-sm text-muted" role="status">{label}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="alert-error flex flex-wrap items-center justify-between gap-3" role="alert">
      <span>{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="btn btn-ghost">Coba lagi</button>}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="card p-6 text-center text-sm text-muted">{children}</div>;
}