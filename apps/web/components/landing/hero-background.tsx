"use client";

import { motion } from "framer-motion";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none bg-black">
      {/* Dynamic Blobs - Orange/White Theme */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] rounded-full bg-orange-500/20 blur-[120px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.3, 0.1],
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[100px]"
      />

      {/* Grid with Moving Beams */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Horizontal Beams */}
      <motion.div
        initial={{ left: "-100%" }}
        animate={{ left: "100%" }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 0 }}
        className="absolute top-[20%] h-[1px] w-[50%] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 blur-[1px]"
      />

      <motion.div
        initial={{ left: "-100%" }}
        animate={{ left: "100%" }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute top-[60%] h-[1px] w-[30%] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-30 blur-[1px]"
      />

      {/* Vertical Beams */}
      <motion.div
        initial={{ top: "-100%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
        className="absolute left-[30%] w-[1px] h-[50%] bg-gradient-to-b from-transparent via-white to-transparent opacity-20 blur-[1px]"
      />

      <motion.div
        initial={{ top: "-100%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 4 }}
        className="absolute right-[20%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-orange-300 to-transparent opacity-20 blur-[1px]"
      />

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('/noise.png')] pointer-events-none" />
    </div>
  );
}
