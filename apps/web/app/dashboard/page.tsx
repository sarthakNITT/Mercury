"use client";

import { useEffect, useState } from "react";
import { api, Metrics, Event, TrendingItem } from "../../lib/api";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label"; // Need Label

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
    return <div className="container py-10">Loading dashboard...</div>;

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {judgesMode ? "Mercury Intelligence" : "Live Dashboard"}
          </h1>
          <Badge
            variant={liveConnected ? "default" : "destructive"}
            className={liveConnected ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {liveConnected ? (
              <span className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
              </span>
            ) : (
              "OFFLINE"
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center space-x-2 mr-2">
            <input
              type="checkbox"
              id="judges-mode"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={judgesMode}
              onChange={(e) => setJudgesMode(e.target.checked)}
            />
            <Label htmlFor="judges-mode" className="font-medium cursor-pointer">
              Judges Mode
            </Label>
          </div>

          {!judgesMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={generating}
            >
              <Database className="mr-2 h-4 w-4" /> Seed DB
            </Button>
          )}

          <Button
            onClick={handleDemoStory}
            disabled={generating}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Play className="mr-2 h-4 w-4" />
            {generating ? "Running..." : "Run Demo Story"}
          </Button>

          {!judgesMode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateValues}
              disabled={generating}
            >
              <Zap className="mr-2 h-4 w-4" /> Gen 50 Events
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Events"
            value={metrics.totalEvents}
            icon={<Activity className="h-4 w-4" />}
            className="border-l-4 border-l-blue-500"
          />
          <MetricCard
            title="Total Products"
            value={metrics.totalProducts}
            icon={<Package className="h-4 w-4" />}
            className="border-l-4 border-l-green-500"
          />
          <MetricCard
            title="Active Users"
            value={metrics.totalUsers}
            icon={<Users className="h-4 w-4" />}
            className="border-l-4 border-l-amber-500"
          />
          {metrics.fraud && (
            <MetricCard
              title="Avg Risk Score"
              value={metrics.fraud.avgRiskScore.toFixed(1)}
              icon={<AlertTriangle className="h-4 w-4" />}
              className="border-l-4 border-l-red-500"
            />
          )}
        </div>
      )}

      {/* Fraud & Breakdown Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Global Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && metrics.breakdown && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.breakdown).map(([type, count]) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                  >
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {metrics && metrics.fraud && (
          <Card className="col-span-3 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Risk Engine Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around text-center">
              <div>
                <div className="text-3xl font-bold text-red-600">
                  {metrics.fraud.blockedCount}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  Blocked
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600">
                  {metrics.fraud.challengeCount}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  Challenged
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity Table */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity (Live)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 10).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          event.type === "PURCHASE"
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300"
                            : event.type === "BLOCK"
                              ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300"
                              : ""
                        }
                      >
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.user?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[150px]">
                      {event.product?.name || "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground h-24"
                    >
                      No recent events
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Trending Column */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              Trending Now (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trending.map((item, index) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm line-clamp-1">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(item.product.price / 100).toFixed(2)}{" "}
                      {item.product.currency}
                    </div>
                  </div>
                </div>
                <Badge className="bg-amber-500">{item.score.toFixed(0)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fraud Feed */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Fraud Feed (High Risk)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {fraudEvents.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{event.user?.name || "Unknown"}</TableCell>
                  <TableCell>{event.product?.name || "Unknown"}</TableCell>
                  <TableCell className="font-bold text-red-500">
                    {event.meta?.riskScore}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.meta?.decision === "BLOCK"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {event.meta?.decision}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {fraudEvents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground h-24"
                  >
                    No suspicious activity detected
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
