"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
}

export const TextReveal = ({ text, className }: TextRevealProps) => {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start 0.8", "start 0.2"],
  });

  const words = text.split(" ");

  return (
    <div ref={targetRef} className={cn("relative z-0 min-h-[50vh]", className)}>
      <div
        className={
          "sticky top-0 mx-auto max-w-6xl flex items-center bg-transparent px-[1rem] py-[5rem]"
        }
      >
        <p
          className={
            "flex flex-wrap text-2xl font-bold md:text-4xl lg:text-5xl"
          }
        >
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const opacity = useTransform(
              scrollYProgress,
              [start, end],
              [0.1, 1],
            );

            return (
              <span key={i} className="relative mx-1 lg:mx-2.5">
                <span className="absolute opacity-10">{word}</span>
                <motion.span
                  style={{ opacity: opacity }}
                  className="text-white"
                >
                  {word}
                </motion.span>
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
};
