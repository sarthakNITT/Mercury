"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden border-b bg-background/50 pb-16 pt-16">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute -left-[10%] top-[-10%] h-[500px] w-[500px] animate-blob rounded-full bg-purple-500/40 mix-blend-multiply blur-3xl filter transition-all duration-1000 dark:bg-purple-800/20" />
        <div className="absolute -right-[10%] top-[-10%] h-[500px] w-[500px] animate-blob animation-delay-2000 rounded-full bg-blue-500/40 mix-blend-multiply blur-3xl filter transition-all duration-1000 dark:bg-blue-800/20" />
        <div className="absolute bottom-[-20%] left-[20%] h-[500px] w-[500px] animate-blob animation-delay-4000 rounded-full bg-pink-500/40 mix-blend-multiply blur-3xl filter transition-all duration-1000 dark:bg-pink-800/20" />
      </div>

      <div className="container flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            v2.0 Now Available
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Real-Time <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Marketplace Intelligence
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Experience the next generation of e-commerce. Live fraud detection,
            real-time recommendations, and instant analytics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row"
        >
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="#products">
              Browse Products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base"
          >
            <Link href="/dashboard">
              <LayoutDashboard className="ml-2 h-4 w-4" />
              Open Dashboard
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
