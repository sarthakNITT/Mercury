import { spawn } from "child_process";

const API_GATEWAY = "http://localhost:4000";
const WEB_URL = "http://localhost:3000";
const ES_URL = "http://localhost:9200";
const PROMETHEUS_URL = "http://localhost:9090";
const GRAFANA_URL = "http://localhost:3100";

async function checkHealth(url: string, name: string) {
  try {
    const res = await fetch(url);
    console.log(`[${name}] ${url} -> ${res.status} ${res.statusText}`);
    return res.ok;
  } catch (e: any) {
    console.log(`[${name}] ${url} -> FAILED: ${e.message}`);
    return false;
  }
}

async function verifyAuth() {
  console.log("\n=== VERIFYING NEXTAUTH ===");
  // 1. Register
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";
  const name = "Test User";

  console.log(`Registering user: ${email}`);
  const regRes = await fetch(`${WEB_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (regRes.ok) {
    console.log("✅ Register SUCCESS");
  } else {
    console.log(`❌ Register FAILED: ${regRes.status} await regRes.text()`);
  }

  // 2. Login (This is harder via fetch due to CSRF tokens in NextAuth, skipping full flow verification via script, relying on manual check or simple presence of interaction)
  // However, we can check if the API endpoints are reachable.
}

async function verifyR2() {
  console.log("\n=== VERIFYING R2 ===");
  const res = await fetch(`${API_GATEWAY}/uploads/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-service-key": "dev-service-key",
    },
    body: JSON.stringify({ filename: "test.png", contentType: "image/png" }),
  });

  if (res.ok) {
    const data = await res.json();
    if (data.uploadUrl && data.publicUrl) {
      console.log("✅ R2 Presign SUCCESS");
      console.log(`   Upload URL: ${data.uploadUrl.substring(0, 50)}...`);
    } else {
      console.log("❌ R2 Presign FAILED (Missing fields)", data);
    }
  } else {
    console.log(`❌ R2 Presign FAILED: ${res.status}`);
  }
}

async function verifySearch() {
  console.log("\n=== VERIFYING ELASTICSEARCH ===");
  const esHealth = await checkHealth(ES_URL, "Elasticsearch");
  if (!esHealth) return;

  // Search query
  const searchRes = await fetch(`${API_GATEWAY}/search/products?q=test`, {
    headers: { "x-service-key": "dev-service-key" },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    console.log("✅ Search Query SUCCESS", data);
  } else {
    console.log(`❌ Search Query FAILED: ${searchRes.status}`);
  }
}

async function verifyMonitoring() {
  console.log("\n=== VERIFYING MONITORING ===");
  await checkHealth(PROMETHEUS_URL, "Prometheus");
  await checkHealth(GRAFANA_URL, "Grafana");

  const services = [
    "api-gateway",
    "catalog-service",
    "media-service",
    "search-service",
  ];
  for (const svc of services) {
    // Map service names to ports for local check, or assume we check via gateway if exposed?
    // We exposed /metrics/prometheus in index.ts of each service.
    // Let's assume looking at port mappings:
    let port = 0;
    if (svc === "api-gateway") port = 4000;
    if (svc === "catalog-service") port = 4001;
    if (svc === "media-service") port = 4008;
    if (svc === "search-service") port = 4009;

    if (port > 0) {
      const url = `http://localhost:${port}/metrics/prometheus`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text.includes("http_requests_total")) {
          console.log(`✅ ${svc} Metrics Exposed`);
        } else {
          console.log(`⚠️ ${svc} Metrics: OK but missing expected metric`);
        }
      } else {
        console.log(`❌ ${svc} Metrics FAILED: ${res.status}`);
      }
    }
  }
}

async function main() {
  await verifyAuth();
  await verifyR2();
  await verifySearch();
  await verifyMonitoring();
}

main();
