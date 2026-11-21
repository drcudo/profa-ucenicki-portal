export default function StatTile({ label, value, hint, icon: Icon }) {
  return (
    <div className="shell-card rounded-xl px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <span className="shell-label">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-primary/70" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}