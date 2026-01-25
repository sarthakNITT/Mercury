"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Product } from "@/lib/api";
import { ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // const isOutOfStock = product.stock <= 0;
  // Temporary bypass for demo
  const isOutOfStock = false;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full outline-none"
    >
      <Card
        className={cn(
          "h-full overflow-hidden transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10",
          "border-border/50 bg-black/40 backdrop-blur-xl",
          "group-focus:ring-2 group-focus:ring-orange-500 group-focus:ring-offset-2",
        )}
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-muted/20">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className={cn(
                "h-full w-full object-cover transition-transform duration-700",
                "group-hover:scale-110",
                isOutOfStock ? "grayscale opacity-60" : "",
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-muted-foreground">
              <Package className="h-8 w-8 opacity-20" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              className="shadow-sm backdrop-blur-md bg-black/60 border-white/10 text-white"
              variant="outline"
            >
              {product.category}
            </Badge>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <Badge
                variant="destructive"
                className="px-3 py-1 text-sm shadow-lg"
              >
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="line-clamp-1 text-lg font-bold group-hover:text-orange-500 transition-colors">
              {product.name}
            </h3>
            <div
              className={cn(
                "h-2 w-2 rounded-full mt-2 shrink-0 animate-pulse",
                isOutOfStock
                  ? "bg-red-500"
                  : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
              )}
            />
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed h-10">
            {product.description}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-5 pt-0">
          <div className="text-xl font-bold tracking-tight text-white">
            {product.currency} {(product.price / 100).toFixed(2)}
          </div>
          <Button
            size="icon"
            className="opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 disabled:opacity-50 bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border/50 bg-card/50">
      <div className="aspect-[4/3] bg-muted/50 animate-pulse" />
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0 justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </CardFooter>
    </Card>
  );
}
