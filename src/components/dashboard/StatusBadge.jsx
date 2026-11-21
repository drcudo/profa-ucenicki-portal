import { cn } from '@/lib/utils';

const styles = {
  'Prihvaćeno': 'bg-success/15 text-success',
  'Potreban ispravak': 'bg-warning/15 text-warning',
  'AI pregledava': 'bg-primary/10 text-primary',
  'Nije predano': 'bg-secondary/60 text-muted-foreground',
  'Za riješiti': 'bg-secondary/60 text-muted-foreground',
  'Završeno': 'bg-success/15 text-success',
  'Zaključano': 'bg-secondary/60 text-muted-foreground',
};

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        styles[status] ?? 'bg-secondary/60 text-muted-foreground',
        className,
      )}
    >
      {status}
    </span>
  );
}