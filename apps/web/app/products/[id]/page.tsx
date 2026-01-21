"use client";

import { useEffect, useState, use } from "react";
import { api, Product, Recommendation } from "../../../lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

function getUserId() {
  if (typeof window === "undefined") return "unknown-user";
  let id = localStorage.getItem("mercury_user_id");
  if (!id) {
    id = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("mercury_user_id", id);
  }
  return id;
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

  useEffect(() => {
    if (!id) return;

    const userId = getUserId();

    // Fetch product
    api
      .getProduct(id)
      .then((p) => {
        setProduct(p);
        // Track VIEW event
        api.trackEvent(userId, "VIEW", id, { source: "product_page" });

        // Fetch recommendations
        api
          .getRecommendations(id, userId)
          .then((res) => setRecommendations(res.recommendations))
          .catch(console.error);
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

    if (type === "PURCHASE") {
      try {
        const risk = await api.scoreRisk(userId, product.id, product.price);

        let allowed = true;
        if (risk.decision === "BLOCK") allowed = false;

        // Always track
        await api.trackEvent(userId, type, product.id, {
          price: product.price,
          currency: product.currency,
          attempted: true,
          allowed,
          riskScore: risk.riskScore,
          decision: risk.decision,
          reasons: risk.reasons.join(", "),
        });

        if (risk.decision === "ALLOW") {
          alert("Payment Successful (Demo)");
        } else if (risk.decision === "CHALLENGE") {
          alert(
            `Payment needs verification.\nRisk Score: ${risk.riskScore}\nReasons: ${risk.reasons.join(", ")}`,
          );
        } else {
          alert(
            `Payment BLOCKED due to high risk!\nRisk Score: ${risk.riskScore}\nReasons: ${risk.reasons.join(", ")}`,
          );
        }
      } catch (err) {
        console.error("Risk check failed", err);
        alert("Payment service unavailable");
      }
      return;
    }

    // Optimistic UI or just fire and forget
    await api.trackEvent(userId, type, product.id, {
      price: product.price,
      currency: product.currency,
    });

    alert(`Event ${type} tracked!`);
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
