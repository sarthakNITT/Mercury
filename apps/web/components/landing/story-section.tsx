"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface StorySectionProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function StorySection({
  title,
  description,
  children,
  align = "left",
  className,
}: StorySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.8, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(scrollYProgress, [0.1, 0.3], [50, 0]);

  return (
    <section
      ref={ref}
      className={cn(
        "min-h-[80vh] flex items-center justify-center py-20 snap-center relative overflow-hidden",
        className,
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{ opacity, y }}
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
            align === "right" ? "lg:items-start" : "",
          )}
        >
          <div
            className={cn("space-y-6", align === "right" ? "lg:order-2" : "")}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              {description}
            </p>
          </div>

          <div
            className={cn("relative", align === "right" ? "lg:order-1" : "")}
          >
            <div className="aspect-square md:aspect-video rounded-3xl bg-gradient-to-br from-muted/50 to-muted border border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm p-4 md:p-8">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
