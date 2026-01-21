"use client";

import { useEffect, useState } from "react";
import { api, Metrics, Event, TrendingItem } from "../../lib/api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [fraudEvents, setFraudEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [judgesMode, setJudgesMode] = useState(false);

  const fetchData = async () => {
    try {
      const [m, e, f, t] = await Promise.all([
        api.getMetrics(),
        api.getRecentEvents(),
        api.getFraudEvents(),
        api.getTrending(5),
      ]);
      setMetrics(m);
      setEvents(e);
      setFraudEvents(f);
      setTrending(t.items);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // const interval = setInterval(fetchData, 3000); // Remove polling in favor of SSE

    // SSE Subscription
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/events/stream`,
    );

    eventSource.onopen = () => {
      setLiveConnected(true);
      console.log("SSE Connected");
    };

    eventSource.onmessage = () => {
      // Just refresh data on event
      // In a real app we'd append to state, but for this hackathon speed, re-fetching is safer/easier
      // to ensure sync with DB state
      fetchData();
    };

    eventSource.onerror = () => {
      setLiveConnected(false);
      eventSource.close();
      // Simple reconnect logic implicitly handled by useEffect if we wanted,
      // but let's just leave it closed or retry on reload for simplicity,
      // or actually valid SSE clients reconnect automatically usually.
      // Browser implementation reconnects automatically.
    };

    return () => {
      eventSource.close();
      // clearInterval(interval);
    };
  }, []);

  const handleDemoStory = async () => {
    setGenerating(true);
    if (judgesMode) {
      // Fast mode for judges
      try {
        await api.runDemoStory("fast");
        alert("30s Demo Story Started! Watch the dashboard.");
      } catch {
        alert("Error starting demo");
      }
    } else {
      try {
        await api.runDemoStory("normal");
        alert("Demo Story Started!");
      } catch {
        alert("Error starting demo");
      }
    }
    setGenerating(false);
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1 className="title" style={{ fontSize: "2rem", marginBottom: 0 }}>
            {judgesMode ? "Mercury Intelligence" : "Live Dashboard"}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: liveConnected
                ? "rgba(50, 255, 100, 0.1)"
                : "rgba(255, 50, 50, 0.1)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: `1px solid ${liveConnected ? "#7ee787" : "#da3633"}`,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: liveConnected ? "#7ee787" : "#da3633",
                boxShadow: liveConnected ? "0 0 8px #7ee787" : "none",
              }}
            ></div>
            <span
              style={{
                fontSize: "0.8rem",
                color: liveConnected ? "#7ee787" : "#da3633",
                fontWeight: "bold",
              }}
            >
              {liveConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              marginRight: "1rem",
            }}
          >
            <input
              type="checkbox"
              checked={judgesMode}
              onChange={(e) => setJudgesMode(e.target.checked)}
            />
            <span style={{ fontWeight: "bold" }}>Judges Mode</span>
          </label>

          {!judgesMode && (
            <button
              onClick={handleSeed}
              disabled={generating}
              className="btn btn-outline"
            >
              Seed Database
            </button>
          )}

          <button
            onClick={handleDemoStory}
            disabled={generating}
            className="btn"
            style={{ backgroundColor: "#a371f7", color: "white" }}
          >
            {generating ? "Running..." : "Run 30s Demo Story"}
          </button>

          {!judgesMode && (
            <button
              onClick={handleGenerateValues}
              disabled={generating}
              className="btn"
            >
              Gen 50 Events
            </button>
          )}
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

      <h2 className="title">Trending Now (24h)</h2>
      <div className="grid" style={{ marginBottom: "2rem" }}>
        {trending.map((item) => (
          <div
            key={item.product.id}
            className="card"
            style={{ padding: "1rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <strong style={{ fontSize: "1.1rem" }}>
                {item.product.name}
              </strong>
              <span
                className="tag"
                style={{ background: "#d29922", color: "white" }}
              >
                {item.score.toFixed(0)} pts
              </span>
            </div>
            <div style={{ color: "#7ee787", fontWeight: "bold" }}>
              {(item.product.price / 100).toFixed(2)} {item.product.currency}
            </div>
          </div>
        ))}
        {trending.length === 0 && (
          <div style={{ color: "grey" }}>No trending data yet.</div>
        )}
      </div>

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
