"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Product } from "../lib/api";
import { HeroSection } from "@/components/home/hero-section";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";

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
      <HeroSection />

      <section id="products" className="container py-12 md:py-16 lg:py-20">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Trending Products
              </h2>
              <p className="text-muted-foreground mt-1">
                Explore our collection of real-time tracked items.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            <div className="flex flex-col items-center justify-center space-y-4">
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
    </div>
  );
}
