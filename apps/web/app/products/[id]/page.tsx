"use client";

import { useEffect, useState, use } from "react";
import { api, Product, Recommendation } from "../../../lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
        // router.push('/'); // optional: redirect if not found
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (type: string) => {
    if (!product) return;
    const userId = getUserId();

    if (!userId) {
      alert("Please select an Active User from the navbar first.");
      return;
    }

    if (type === "PURCHASE") {
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
          // Redirect to Stripe
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

  if (loading) return <div className="container">Loading details...</div>;
  if (!product) return <div className="container">Product not found.</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <button
        onClick={() => router.back()}
        className="btn btn-outline"
        style={{ marginBottom: "1rem" }}
      >
        &larr; Back
      </button>

      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", gap: "2rem", flexDirection: "column" }}>
          <div className="card-img" style={{ height: "300px" }}>
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "No Image"
            )}
          </div>

          <div>
            <h1 className="title" style={{ fontSize: "2.5rem" }}>
              {product.name}
            </h1>
            <p style={{ color: "#8b949e", fontSize: "1.2rem" }}>
              {product.category}
            </p>
            {trendingScore && (
              <div
                className="tag"
                style={{
                  display: "inline-block",
                  background: "linear-gradient(45deg, #f85149, #d29922)",
                  color: "white",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                🔥 Trending Score: {trendingScore}
              </div>
            )}
            <p className="price" style={{ fontSize: "2rem", margin: "1rem 0" }}>
              {(product.price / 100).toFixed(2)} {product.currency}
            </p>
            <p
              style={{
                lineHeight: "1.6",
                fontSize: "1.1rem",
                marginBottom: "2rem",
              }}
            >
              {product.description}
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={() => handleAction("CLICK")}
                className="btn"
                style={{ background: "#e3b341", color: "black" }}
              >
                Simulate Click
              </button>
              <button
                onClick={() => handleAction("CART")}
                className="btn"
                style={{ background: "#d29922" }}
              >
                Add to Cart
              </button>
              <button
                onClick={() => handleAction("PURCHASE")}
                className="btn btn-success"
              >
                Buy Now (Demo)
              </button>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h2
            className="title"
            style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}
          >
            Recommended for you
          </h2>
          <div className="grid">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="card"
                onClick={() => router.push(`/products/${rec.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="card-img" style={{ height: "150px" }}>
                  {rec.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "No Image"
                  )}
                </div>
                <div className="card-body">
                  <h4 style={{ margin: "0 0 0.5rem 0" }}>{rec.name}</h4>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ color: "#7ee787" }}>
                      {(rec.price / 100).toFixed(2)} {rec.currency}
                    </span>
                    <span style={{ fontWeight: "bold" }}>{rec.score}</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#8b949e",
                      fontStyle: "italic",
                    }}
                  >
                    {rec.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
