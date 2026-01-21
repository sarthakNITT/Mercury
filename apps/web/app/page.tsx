"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Product } from "../lib/api";
import Image from "next/image";

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

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        Loading marketplace...
      </div>
    );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 className="title" style={{ fontSize: "2rem" }}>
          Trending Products
        </h1>
        <div>{/* Optional filter/sort controls could go here */}</div>
      </div>

      <div className="grid">
        {products.map((product) => (
          <Link
            href={`/products/${product.id}`}
            key={product.id}
            className="card"
          >
            <div className="card-img">
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
            <div className="card-body">
              <h3 className="title">{product.name}</h3>
              <p
                style={{
                  color: "#8b949e",
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                }}
              >
                {product.category}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="price">
                  {(product.price / 100).toFixed(2)} {product.currency}
                </span>
                <span
                  className="btn btn-outline"
                  style={{ fontSize: "0.8rem" }}
                >
                  View Details
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
