"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Feature {
  name: string;
  description: string;
  highlight?: boolean;
  points: string[];
}

const features: Feature[] = [
  {
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
  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Enterprise-grade capabilties
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to build a safe, engaging, and profitable
          marketplace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {features.map((feature) => (
          <div
            key={feature.name}
            className={cn(
              "relative rounded-2xl p-8 flex flex-col border transition-all duration-300",
              feature.highlight
                ? "bg-gradient-to-b from-orange-500/20 to-background border-orange-500/50 shadow-2xl shadow-orange-500/10"
                : "bg-card/30 backdrop-blur-sm border-border/50 hover:border-border/80",
            )}
          >
            {feature.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-lg">
                Core Feature
              </div>
            )}

            <div className="mb-6">
              <h3
                className={cn(
                  "text-2xl font-bold",
                  feature.highlight ? "text-orange-500" : "text-foreground",
                )}
              >
                {feature.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {feature.description}
              </p>
            </div>

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
                  {point}
                </li>
              ))}
            </ul>

            <Button
              variant={feature.highlight ? "default" : "outline"}
              className={cn(
                "w-full rounded-full",
                feature.highlight
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "",
              )}
            >
              Learn more
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
