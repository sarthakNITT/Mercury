"use client";

import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
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
    // Start animation when top of section hits 60% of viewport
    // End animation when bottom of section hits 80% of viewport (allows scrolling past to finish)
    offset: ["start 0.6", "end 0.8"],
  });

  const words = text.split(" ");
  // Calculate total characters to normalize progress
  const totalChars = words.reduce((acc, word) => acc + word.length, 0);

  let currentCharIndex = 0;

  return (
    <div
      ref={targetRef}
      className={cn("relative z-0 min-h-[200vh]", className)}
    >
      <div
        className={
          "sticky top-0 mx-auto max-w-6xl flex items-center bg-transparent px-[1rem] py-[5rem] h-screen"
        }
      >
        <p
          className={
            "flex flex-wrap text-2xl font-bold md:text-4xl lg:text-5xl leading-tight"
          }
        >
          {words.map((word, i) => {
            const wordContent = (
              <Word
                key={i}
                word={word}
                startIndex={currentCharIndex}
                totalChars={totalChars}
                progress={scrollYProgress}
              />
            );
            currentCharIndex += word.length;
            return wordContent;
          })}
        </p>
      </div>
    </div>
  );
};

interface WordProps {
  word: string;
  startIndex: number;
  totalChars: number;
  progress: MotionValue<number>;
}

const Word = ({ word, startIndex, totalChars, progress }: WordProps) => {
  const chars = word.split("");
  return (
    <span className="inline-block whitespace-nowrap mr-2 lg:mr-4">
      {chars.map((char, i) => {
        const globalIndex = startIndex + i;
        // Map global index to a range [0, 1] relative to the text length
        // We want the "active window" to be a fraction of the total scroll
        const start = globalIndex / totalChars;
        const end = start + (1 / totalChars) * 5; // Window size ~ 5 chars for the gradient transition

        return (
          <Char key={i} char={char} range={[start, end]} progress={progress} />
        );
      })}
    </span>
  );
};

interface CharProps {
  char: string;
  range: [number, number];
  progress: MotionValue<number>;
}

const Char = ({ char, range, progress }: CharProps) => {
  const opacity = useTransform(progress, range, [0.2, 1]);

  // Ensure we hit the final color by clamping the range end slightly before 1.0 if needed,
  // or just ensuring the input range is valid.
  // We use [start, mid, end] -> [Dark, Orange, White]
  const mid = range[0] + (range[1] - range[0]) / 2;
  const color = useTransform(
    progress,
    [range[0], mid, range[1]],
    ["#333333", "#F97316", "#FFFFFF"],
  );

  return <motion.span style={{ opacity, color }}>{char}</motion.span>;
};
