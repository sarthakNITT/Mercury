"use client";

import { useEffect, useState } from "react";
import { api, Metrics, Event } from "../../lib/api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      const [m, e] = await Promise.all([
        api.getMetrics(),
        api.getRecentEvents(),
      ]);
      setMetrics(m);
      setEvents(e);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSeed = async () => {
    if (!confirm("This will add products and users. Continue?")) return;
    setGenerating(true);
    try {
      const res = await api.seed();
      alert(`Seeded! Users: ${res.users}, Products: ${res.products}`);
      fetchData();
    } catch {
      alert("Error seeding");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateValues = async () => {
    setGenerating(true);
    try {
      const res = await api.generateDemoEvents(50);
      alert(`Generated ${res.generated} events!`);
      fetchData();
    } catch {
      alert("Error generating events");
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !metrics)
    return <div className="container">Loading dashboard...</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 className="title" style={{ fontSize: "2rem" }}>
          Live Dashboard
        </h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleSeed}
            disabled={generating}
            className="btn btn-outline"
          >
            Seed Database
          </button>
          <button
            onClick={handleGenerateValues}
            disabled={generating}
            className="btn"
          >
            Generate 50 Demo Events
          </button>
        </div>
      </div>

      {metrics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Events</div>
            <div className="stat-value" style={{ color: "#58a6ff" }}>
              {metrics.totalEvents}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Products</div>
            <div className="stat-value" style={{ color: "#7ee787" }}>
              {metrics.totalProducts}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Users</div>
            <div className="stat-value" style={{ color: "#d29922" }}>
              {metrics.totalUsers}
            </div>
          </div>
        </div>
      )}

      {metrics && metrics.breakdown && (
        <div
          style={{
            marginBottom: "2rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(metrics.breakdown).map(([type, count]) => (
            <div
              key={type}
              className="tag"
              style={{
                fontSize: "1rem",
                padding: "0.5rem 1rem",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
              }}
            >
              {type}: <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}

      <h2 className="title">Recent Activity (Live)</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>User</th>
              <th>Product</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td style={{ color: "#8b949e", fontSize: "0.9rem" }}>
                  {new Date(event.createdAt).toLocaleTimeString()}
                </td>
                <td>
                  <span className={`tag tag-${event.type}`}>{event.type}</span>
                </td>
                <td>{event.user?.name || "Unknown"}</td>
                <td>{event.product?.name || "Unknown"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No events yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
