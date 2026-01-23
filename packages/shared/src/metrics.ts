import client from "prom-client";

export const metrics = {
  httpRequestDurationMicroseconds: new client.Histogram({
    name: "http_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.1, 5, 15, 50, 100, 500, 1000, 3000, 5000], // bucket sizes
  }),
  httpRequestsTotal: new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  }),
};

export function setupMetrics(serviceName: string) {
  client.collectDefaultMetrics({
    prefix: `${serviceName.replace(/-/g, "_")}_`,
  });
}

export async function metricsHandler(request: any, reply: any) {
  reply.header("Content-Type", client.register.contentType);
  return client.register.metrics();
}

export const metricsHook = async (request: any, reply: any) => {
  // Use onResponse to capture standard requests
  // Implementation depends on how it's called.
  // We will just expose the objects for manual use in middlewares.
};
