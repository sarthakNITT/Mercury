"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { api, Product } from "../lib/api";
import { Button } from "@/components/ui/button";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/shop/product-card";
import { EmptyState } from "@/components/common/empty-state";
import { HeroBackground } from "@/components/landing/hero-background";
import { TextReveal } from "@/components/landing/text-reveal";
import { TechMarquee } from "@/components/landing/tech-marquee";
import { FeatureCards } from "@/components/landing/feature-cards";
import { FAQSection } from "@/components/landing/faq-section";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroBackground />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-8 max-w-4xl z-10"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            v1.0 Live Demo
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Next-gen commerce <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              intelligence stack
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real-time fraud detection, instant recommendations, and live
            observability for modern marketplaces.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              asChild
              className="h-11 px-8 rounded-full shadow-lg shadow-primary/20"
            >
              <Link href="#products">
                Browse Products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 px-8 rounded-full backdrop-blur-sm bg-background/50 hover:bg-background/80"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="ml-2 h-4 w-4" />
                Open Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Scroll Hint */}
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground/50"
        >
          <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center p-1">
            <div className="w-1 h-3 bg-current rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* TECH MARQUEE */}
      <TechMarquee />

      {/* TEXT REVEAL SECTION */}
      <section className="min-h-screen bg-background relative z-10">
        <TextReveal text="Mercury connects to apps, tools, and databases, syncs their data in real time, and exposes it through a unified search interface. This enables AI systems to reliably retrieve grounded, up-to-date information from real data sources on demand via an LLM-friendly interface." />
      </section>

      {/* FEATURE CARDS */}
      <FeatureCards />

      {/* PRODUCTS GRID */}
      <section
        id="products"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen"
      >
        <div className="flex flex-col gap-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight">
              Live Product Feed
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore our collection of real-time tracked items. All
              interactions are monitored by Mercury.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}

            {!loading &&
              products.length > 0 &&
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>

          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <EmptyState
                title="No products found"
                description="The marketplace is currently empty. Add products via Admin."
              />
              <Button asChild variant="outline">
                <Link href="/admin/products">Go to Admin</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
      {/* FAQ SECTION */}
      <FAQSection />
    </div>
  );
}
