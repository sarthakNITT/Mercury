import { FileX2 } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No items found",
  description = "There are no items to display at this time.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in-50 bg-card/30 backdrop-blur-md border border-border/50 rounded-3xl p-12 w-full max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[80px]" />

      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-background to-muted shadow-inner mb-6 ring-1 ring-border/50">
        <FileX2 className="h-10 w-10 text-muted-foreground/40" />
      </div>

      <h3 className="relative text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="relative mt-3 text-base text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
