export function LoadingPanel({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="surface flex min-h-56 items-center justify-center rounded-[2rem]">
      <div className="text-center">
        <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
