"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Feature {
  id: string;
  name: string;
  description: string;
  highlight?: boolean;
  points: string[];
}

const features: Feature[] = [
  {
    id: "realtime",
    name: "Real-time",
    description: "Instant event processing",
    points: [
      "Sub-millisecond latency",
      "Live socket updates",
      "Event replay capability",
      "Optimized for scale",
    ],
  },
  {
    id: "risk",
    name: "Risk Engine",
    description: "Advanced fraud detection",
    highlight: true,
    points: [
      "Behavioral analysis",
      "Velocity checks",
      "IP reputation scoring",
      "Auto-blocking rules",
      "Machine Learning models",
      "Custom risk thresholds",
    ],
  },
  {
    id: "intelligence",
    name: "Intelligence",
    description: "Smart recommendations",
    points: [
      "Collaborative filtering",
      "User history tracking",
      "Trending item boost",
      "Personalized feeds",
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Deep observability",
    points: [
      "Live conversion funnels",
      "User session playback",
      "Revenue tracking",
      "Custom reports",
    ],
  },
];

export function FeatureCards() {
  const [activeId, setActiveId] = useState<string | null>("risk");

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Enterprise-grade capabilities
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to build a safe, engaging, and profitable
          marketplace.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[500px]">
        {features.map((feature) => {
          const isActive = activeId === feature.id;
          return (
            <motion.div
              key={feature.id}
              layout
              onClick={() => setActiveId(feature.id)}
              className={cn(
                "relative rounded-2xl p-8 flex flex-col border transition-colors duration-300 cursor-pointer overflow-hidden",
                isActive
                  ? feature.highlight
                    ? "bg-gradient-to-b from-orange-500/20 to-background border-orange-500/50 shadow-2xl shadow-orange-500/10"
                    : "bg-card border-primary/50 shadow-xl"
                  : "bg-card/30 hover:bg-card/50 border-border/50",
                isActive ? "lg:flex-[2]" : "lg:flex-[1]",
              )}
            >
              {feature.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-lg z-10">
                  Core Feature
                </div>
              )}

              <div className="mb-6">
                <motion.h3
                  layout="position"
                  className={cn(
                    "text-2xl font-bold whitespace-nowrap",
                    feature.highlight ? "text-orange-500" : "text-foreground",
                  )}
                >
                  {feature.name}
                </motion.h3>
                <motion.p
                  layout="position"
                  className="text-sm text-muted-foreground mt-2"
                >
                  {feature.description}
                </motion.p>
              </div>

              {/* Collapsible Content */}
              <motion.div
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.5 }}
                className={cn("flex-1 overflow-hidden flex flex-col")}
              >
                <ul className="space-y-4 mb-8 flex-1">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <div
                        className={cn(
                          "mt-1 p-0.5 rounded-full shrink-0",
                          feature.highlight
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span
                        className={cn(
                          isActive
                            ? "block"
                            : "hidden sm:block lg:hidden xl:block",
                        )}
                      >
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={feature.highlight ? "default" : "outline"}
                  className={cn(
                    "w-full rounded-full transition-all",
                    feature.highlight
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "",
                    isActive
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto",
                  )}
                >
                  {isActive ? "Explore Features" : "Learn more"}{" "}
                  <ArrowRight
                    className={cn(
                      "ml-2 h-4 w-4",
                      isActive ? "block" : "hidden",
                    )}
                  />
                </Button>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
