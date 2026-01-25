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
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 bg-muted/20 border border-dashed rounded-3xl p-8 w-full max-w-lg mx-auto">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-6 shadow-none">
        <FileX2 className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
