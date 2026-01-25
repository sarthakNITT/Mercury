"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden backdrop-blur-sm bg-card/50 border-border/50",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground opacity-70 p-1.5 bg-muted/50 rounded-md">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
