"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Feature {
  id: string;
  name: string;
  description: string;
  details: string;
  highlight?: boolean;
  points: string[];
}

const features: Feature[] = [
  {
    id: "realtime",
    name: "Real-time",
    description: "Instant event processing",
    details:
      "Built on a high-concurrency event loop that processes millions of signals per second. Mercury ensures that every interaction—from a click to a transaction—is captured and acted upon in sub-milliseconds, enabling true real-time experiences for your users.",
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
    details:
      "Our proprietary Risk Engine analyzes over 50 behavioral data points in real-time. By leveraging machine learning models trained on global fraud patterns, we block malicious actors instantly without adding friction for legitimate users. Customize rules to fit your business logic.",
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
    details:
      "Drive engagement with a recommendation system that learns from every interaction. Whether it's collaborative filtering for products or content-based matching for personalized feeds, Mercury's Intelligence layer boosts conversion rates by serving the right content at the right time.",
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
    details:
      "Gain complete visibility into your marketplace's health. Track conversion funnels live, replay user sessions to understand drop-offs, and generate custom revenue reports. Mercury gives you the data you need to make informed decisions without the lag of traditional analytics.",
    points: [
      "Live conversion funnels",
      "User session playback",
      "Revenue tracking",
      "Custom reports",
    ],
  },
];

export function FeatureCards() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

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

      <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[600px] transition-all duration-500">
        {features.map((feature) => {
          const isActive = activeId === feature.id;
          return (
            <motion.div
              key={feature.id}
              layout
              onClick={() => handleToggle(feature.id)}
              className={cn(
                "relative rounded-2xl p-8 flex flex-col border transition-all duration-300 cursor-pointer overflow-hidden",
                isActive
                  ? feature.highlight
                    ? "bg-gradient-to-b from-orange-500/10 to-background border-orange-500/50 shadow-2xl shadow-orange-500/10"
                    : "bg-card border-primary/50 shadow-xl"
                  : "bg-card/30 hover:bg-card/50 border-border/50 hover:border-border/80",
                isActive ? "lg:flex-[3]" : "lg:flex-[1]",
              )}
            >
              {feature.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-lg z-10">
                  Core Feature
                </div>
              )}

              <div className="mb-2">
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
                  className="text-sm text-muted-foreground mt-2 font-medium"
                >
                  {feature.description}
                </motion.p>
              </div>

              {/* Collapsible Content */}
              <motion.div
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                className={cn(
                  "flex-1 overflow-hidden flex flex-col space-y-6",
                  isActive ? "block" : "hidden", // Force layout recalculation when hidden
                )}
              >
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground leading-relaxed text-base pt-4"
                >
                  {feature.details}
                </motion.p>

                <ul className="space-y-3">
                  {feature.points.map((point, idx) => (
                    <motion.li
                      key={point}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{
                        opacity: isActive ? 1 : 0,
                        x: isActive ? 0 : -10,
                      }}
                      transition={{ delay: 0.2 + idx * 0.05 }}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <div
                        className={cn(
                          "p-1 rounded-full shrink-0",
                          feature.highlight
                            ? "text-orange-500 bg-orange-500/10"
                            : "text-primary bg-primary/10",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {!isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-auto pt-8 flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors"
                >
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
