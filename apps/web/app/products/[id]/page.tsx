"use client";

import { useEffect, useState, use } from "react";
import { api, Product, Recommendation } from "../../../lib/api";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shop/product-card";
import {
  ArrowLeft,
  ShoppingCart,
  MousePointer2,
  CreditCard,
  Flame,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

function getUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mercury.activeUserId");
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Unwrap params using React.use()
  const { id } = use(params);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [trendingScore, setTrendingScore] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const userId = getUserId();

    // Fetch product
    api
      .getProduct(id)
      .then((p) => {
        setProduct(p);

        if (userId) {
          // Track VIEW event
          api.trackEvent(userId, "VIEW", id, { source: "product_page" });

          // Fetch recommendations
          api
            .getRecommendations(id, userId)
            .then((res) => setRecommendations(res.recommendations))
            .catch(console.error);
        }

        // Check trending (Global)
        api
          .getTrending(20)
          .then((res) => {
            const hit = res.items.find((i) => i.product.id === id);
            if (hit) setTrendingScore(hit.score);
          })
          .catch(() => {});
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const [paymentEnabled, setPaymentEnabled] = useState(true);

  useEffect(() => {
    api.getPaymentStatus().then((s) => setPaymentEnabled(s.enabled));
  }, []);

  const handleAction = async (type: string) => {
    if (!product) return;
    const userId = getUserId();

    if (!userId) {
      alert("Please select an Active User from the navbar first.");
      return;
    }

    if (type === "PURCHASE") {
      if (!paymentEnabled) {
        alert("Payments are disabled in this production demo.");
        return;
      }
      try {
        setLoading(true);
        const checkout = await api.createCheckoutSession(userId, [
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        ]);

        setLoading(false);

        if (checkout.error) {
          if (checkout.error === "PAYMENTS_DISABLED") {
            setPaymentEnabled(false);
            alert("Payments are disabled in this production demo.");
            return;
          }
          alert(
            `Transaction Failed: ${checkout.error}\n\n${checkout.reasons ? checkout.reasons.join(", ") : ""}`,
          );
          return;
        }

        if (checkout.decision === "BLOCK") {
          alert(
            `Transaction Blocked by Risk Engine.\nReasons: ${checkout.reasons?.join(", ")}`,
          );
          return;
        }

        if (checkout.url) {
          window.location.href = checkout.url;
        } else {
          alert("Could not generate payment session.");
        }
      } catch (err) {
        console.error("Purchase failed", err);
        alert("Payment service unavailable");
        setLoading(false);
      }
      return;
    }

    // Optimistic UI or just fire and forget
    if (userId) {
      await api.trackEvent(userId, type, product.id, {
        price: product.price,
        currency: product.currency,
      });
    }

    if (type === "CART") alert("Added to cart!");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Skeleton className="h-10 w-32" />
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
          <div className="space-y-6 pt-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-40 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product)
    return (
      <div className="container py-20 text-center">Product not found.</div>
    );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in-50 duration-700">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-8 pl-0 hover:bg-transparent hover:text-primary group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />{" "}
        Back to Marketplace
      </Button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Left Column: Image - Sticky */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border bg-muted/30 lg:sticky lg:top-24">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No Image Available
            </div>
          )}

          {trendingScore && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-none shadow-lg backdrop-blur-md px-3 py-1.5 flex gap-1.5 items-center">
                <Flame className="h-3.5 w-3.5 fill-current" />
                High Demand
              </Badge>
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col gap-8 pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-medium"
              >
                {product.category}
              </Badge>
              {trendingScore && (
                <span className="text-xs font-mono text-muted-foreground">
                  Trend Score: {trendingScore}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
              {product.name}
            </h1>

            <div className="text-3xl font-bold text-primary">
              {product.currency} {(product.price / 100).toFixed(2)}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {!paymentEnabled && (
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex items-start gap-3">
              <div className="mt-0.5 p-1 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  Payments Disabled
                </h4>
                <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-0.5">
                  Transactions are currently disabled in this demo environment.
                </p>
              </div>
            </div>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Button
              size="lg"
              className="w-full h-14 text-base rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
              onClick={() => handleAction("PURCHASE")}
              disabled={!paymentEnabled}
            >
              <CreditCard className="h-5 w-5" />
              {paymentEnabled ? "Buy Now" : "Sales Disabled"}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-full rounded-xl gap-2"
                onClick={() => handleAction("CART")}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl gap-2 hover:bg-secondary/50"
                onClick={() => handleAction("CLICK")}
              >
                <MousePointer2 className="h-4 w-4" />
                Simulate Click
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-muted-foreground">
            <div className="flex flex-col gap-1 items-center justify-center p-3 rounded-lg bg-muted/30">
              <span className="font-semibold text-foreground">
                Fast Delivery
              </span>
              <span>2-3 Days</span>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center p-3 rounded-lg bg-muted/30">
              <span className="font-semibold text-foreground">Returns</span>
              <span>30 Days</span>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center p-3 rounded-lg bg-muted/30">
              <span className="font-semibold text-foreground">Secure</span>
              <span>Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-24 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Recommended for you
              </h2>
              <p className="text-muted-foreground mt-2">
                Personalized suggestions based on your history and similar
                users.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x sm:grid sm:grid-cols-2 md:grid-cols-4 sm:overflow-visible sm:pb-0 sm:px-0 gap-6 no-scrollbar">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="min-w-[280px] sm:min-w-0 snap-center relative group"
                >
                  <ProductCard
                    product={{
                      id: rec.id,
                      name: rec.name,
                      description: rec.reason,
                      price: rec.price,
                      currency: rec.currency,
                      category: rec.category,
                      imageUrl: rec.imageUrl,
                    }}
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-emerald-600/90 text-white shadow-sm border-none backdrop-blur-sm">
                      Match: {rec.score}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
