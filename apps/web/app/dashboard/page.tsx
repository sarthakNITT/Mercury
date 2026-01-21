"use client";

import { useEffect, useState } from "react";
import { api, Metrics, Event } from "../../lib/api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [fraudEvents, setFraudEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      const [m, e, f] = await Promise.all([
        api.getMetrics(),
        api.getRecentEvents(),
        api.getFraudEvents(),
      ]);
      setMetrics(m);
      setEvents(e);
      setFraudEvents(f);
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

      {metrics && metrics.fraud && (
        <div className="stats-grid" style={{ marginTop: "1rem" }}>
          <div className="stat-card" style={{ borderColor: "#da3633" }}>
            <div className="stat-label" style={{ color: "#da3633" }}>
              Blocked Txns
            </div>
            <div className="stat-value">{metrics.fraud.blockedCount}</div>
          </div>
          <div className="stat-card" style={{ borderColor: "#d29922" }}>
            <div className="stat-label" style={{ color: "#d29922" }}>
              Challenged
            </div>
            <div className="stat-value">{metrics.fraud.challengeCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Risk Score</div>
            <div className="stat-value">
              {metrics.fraud.avgRiskScore.toFixed(1)}
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

      <h2 className="title" style={{ marginTop: "2rem", color: "#da3633" }}>
        Fraud Feed (High Risk)
      </h2>
      <div className="card" style={{ borderColor: "#da3633" }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Product</th>
              <th>Risk</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {fraudEvents.map((event: any) => (
              <tr key={event.id}>
                <td style={{ color: "#8b949e", fontSize: "0.9rem" }}>
                  {new Date(event.createdAt).toLocaleTimeString()}
                </td>
                <td>{event.user?.name || "Unknown"}</td>
                <td>{event.product?.name || "Unknown"}</td>
                <td style={{ fontWeight: "bold" }}>{event.meta?.riskScore}</td>
                <td>
                  <span
                    className="tag"
                    style={{
                      backgroundColor:
                        event.meta?.decision === "BLOCK"
                          ? "#da3633"
                          : "#d29922",
                      color: "white",
                    }}
                  >
                    {event.meta?.decision}
                  </span>
                </td>
              </tr>
            ))}
            {fraudEvents.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  No suspicious activity detected
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
