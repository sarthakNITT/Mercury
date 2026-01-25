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
      <div className="container py-10 space-y-8">
        <Skeleton className="h-10 w-32" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product)
    return <div className="container py-10">Product not found.</div>;

  return (
    <div className="container py-10">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Left Column: Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
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
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col gap-6">
          <div>
            <Badge variant="outline" className="mb-2">
              {product.category}
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">
              {product.currency} {(product.price / 100).toFixed(2)}
            </div>
            {trendingScore && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              >
                <Flame className="h-3 w-3" />
                Trending Score: {trendingScore}
              </Badge>
            )}
          </div>

          {!paymentEnabled && (
            <div className="rounded-md bg-yellow-500/15 p-3 text-sm font-medium text-yellow-600 dark:text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
              Payments are disabled in this production demo.
            </div>
          )}

          <p className="text-lg text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={() => handleAction("PURCHASE")}
              disabled={!paymentEnabled}
            >
              <CreditCard className="h-4 w-4" />
              {paymentEnabled ? "Buy Now" : "Sales Disabled"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 gap-2"
              onClick={() => handleAction("CART")}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleAction("CLICK")}
            >
              <MousePointer2 className="h-4 w-4" />
              Simulate Click
            </Button>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Recommended for you
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              // Adapter only, since ProductCard expects Product.
              // We'll trust the shape is close enough or map it.
              // Recommendation actually matches mostly Product, except 'reason' and 'score'.
              // We'll reconstruct a Product object.
              <div key={rec.id} className="relative group">
                <ProductCard
                  product={{
                    id: rec.id,
                    name: rec.name,
                    description: rec.reason, // Use reason as description for context
                    price: rec.price,
                    currency: rec.currency,
                    category: rec.category,
                    imageUrl: rec.imageUrl,
                  }}
                />
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-emerald-600 text-white shadow-sm">
                    Match: {rec.score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
