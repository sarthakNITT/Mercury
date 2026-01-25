"use client";

import { useEffect, useState } from "react";
import { api, Metrics, Event, TrendingItem } from "@/lib/api";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EventsTable } from "@/components/dashboard/events-table";
import { FraudTable } from "@/components/dashboard/fraud-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  Users,
  Package,
  Play,
  Zap,
  Database,
  Flame,
} from "lucide-react";
import { Label } from "@/components/ui/label";

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

    // SSE Subscription
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/events/stream`,
    );

    eventSource.onopen = () => {
      setLiveConnected(true);
      console.log("SSE Connected");
    };

    eventSource.onmessage = () => {
      fetchData();
    };

    eventSource.onerror = () => {
      setLiveConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleDemoStory = async () => {
    setGenerating(true);
    try {
      if (judgesMode) {
        await api.runDemoStory("fast");
        alert("30s Demo Story Started! Watch the dashboard.");
      } else {
        await api.runDemoStory("normal");
        alert("Demo Story Started!");
      }
    } catch {
      alert("Error starting demo");
    } finally {
      setGenerating(false);
    }
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
    return (
      <div className="container py-20 text-center animate-pulse">
        Loading dashboard environment...
      </div>
    );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {judgesMode ? "Mercury Intelligence" : "Live Dashboard"}
          </h1>
          <Badge
            variant={liveConnected ? "default" : "destructive"}
            className={
              liveConnected
                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-sm border-emerald-500/20"
                : ""
            }
          >
            {liveConnected ? (
              <span className="flex items-center gap-2 px-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE
              </span>
            ) : (
              "OFFLINE"
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-end">
          <div className="flex items-center space-x-2 mr-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
            <input
              type="checkbox"
              id="judges-mode"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              checked={judgesMode}
              onChange={(e) => setJudgesMode(e.target.checked)}
            />
            <Label
              htmlFor="judges-mode"
              className="font-medium cursor-pointer text-sm"
            >
              Judges Mode
            </Label>
          </div>

          {!judgesMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={generating}
              className="h-9"
            >
              <Database className="mr-2 h-3.5 w-3.5" /> Seed DB
            </Button>
          )}

          <Button
            onClick={handleDemoStory}
            disabled={generating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 shadow-lg shadow-primary/20"
          >
            <Play className="mr-2 h-3.5 w-3.5 fill-current" />
            {generating ? "Running..." : "Run Demo Story"}
          </Button>

          {!judgesMode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateValues}
              disabled={generating}
              className="h-9"
            >
              <Zap className="mr-2 h-3.5 w-3.5" /> Gen 50 Events
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Events"
            value={metrics.totalEvents}
            icon={<Activity className="h-4 w-4" />}
            className="border-t-4 border-t-blue-500 hover:shadow-lg transition-all"
          />
          <MetricCard
            title="Total Products"
            value={metrics.totalProducts}
            icon={<Package className="h-4 w-4" />}
            className="border-t-4 border-t-emerald-500 hover:shadow-lg transition-all"
          />
          <MetricCard
            title="Active Users"
            value={metrics.totalUsers}
            icon={<Users className="h-4 w-4" />}
            className="border-t-4 border-t-amber-500 hover:shadow-lg transition-all"
          />
          {metrics.fraud && (
            <MetricCard
              title="Avg Risk Score"
              value={metrics.fraud.avgRiskScore.toFixed(1)}
              icon={<AlertTriangle className="h-4 w-4" />}
              className="border-t-4 border-t-red-500 hover:shadow-lg transition-all"
            />
          )}
        </div>
      )}

      {/* Fraud & Breakdown Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Global Activity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && metrics.breakdown && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.breakdown).map(([type, count]) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-sm px-3 py-1 bg-secondary/50 font-mono"
                  >
                    {type}: <span className="ml-1 font-bold">{count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {metrics && metrics.fraud && (
          <Card className="col-span-3 border-red-500/20 bg-red-500/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 text-base font-semibold">
                Risk Engine Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around text-center">
              <div className="bg-background/80 p-4 rounded-xl shadow-sm min-w-[100px]">
                <div className="text-3xl font-bold text-red-600">
                  {metrics.fraud.blockedCount}
                </div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mt-1">
                  Blocked
                </div>
              </div>
              <div className="bg-background/80 p-4 rounded-xl shadow-sm min-w-[100px]">
                <div className="text-3xl font-bold text-amber-600">
                  {metrics.fraud.challengeCount}
                </div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mt-1">
                  Challenged
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity Table */}
        <EventsTable events={events} />

        {/* Trending Column */}
        <Card className="col-span-3 border-amber-500/20 bg-amber-500/5 backdrop-blur-sm h-fit sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-base">
              <Flame className="h-5 w-5 fill-current" />
              Trending Now (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trending.map((item, index) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between border-b border-amber-500/10 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background font-bold text-sm shadow-sm text-amber-600 ring-1 ring-amber-500/20">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm line-clamp-1">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {(item.product.price / 100).toFixed(2)}{" "}
                      {item.product.currency}
                    </div>
                  </div>
                </div>
                <Badge className="bg-amber-500 hover:bg-amber-600 border-none">
                  {item.score.toFixed(0)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fraud Feed */}
      <FraudTable events={fraudEvents} />
    </div>
  );
}
