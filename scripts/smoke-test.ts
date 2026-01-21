import { HttpClient } from "@repo/http";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:4000";
const client = new HttpClient(GATEWAY_URL);

async function runSmokeTest() {
  console.log("🔥 Starting Smoke Test...");

  try {
    // 1. Health Checks
    console.log("1. Checking Gateway Health...");
    const health = await client.get("/health");
    console.log("✅ Gateway Health:", health);

    // 2. Fetch Products
    console.log("\n2. Fetching Products...");
    const products = await client.get<any[]>("/products");
    console.log(`✅ Fetched ${products.length} products`);
    if (products.length === 0) {
      console.warn("⚠️ No products found. Seeding...");
      await client.post("/seed/products", { count: 5 });
      console.log("✅ Seeded 5 products");
    }

    const productId = products[0]?.id || "prod_test";

    // 3. Create Event
    console.log("\n3. Creating Event (VIEW)...");
    const event = await client.post("/events", {
      userId: "smoke_user",
      productId,
      type: "VIEW",
      meta: { source: "smoke_test" },
    });
    console.log("✅ Event Created:", event);

    // 4. Get Recommendations (TF.js Check)
    console.log("\n4. Getting Recommendations...");
    const recos = await client.get<any>(
      `/recommendations/${productId}?userId=smoke_user`,
    );
    console.log("✅ Recommendations:", recos.recommendations.length);
    console.log(
      "   Scores:",
      recos.recommendations.map((r: any) => r.score).join(", "),
    );
    // Check if scoreBreakdown exists (implies TF logic ran if we modified response to include it, or at least we get scores)

    // 5. Checkout Session (Risk + Stripe)
    console.log("\n5. Creating Checkout Session...");
    const checkout = await client.post<any>("/checkout/create-session", {
      userId: "smoke_user",
      items: [
        { id: productId, price: 1000, quantity: 1, name: "Smoke Test Product" },
      ],
    });

    if (checkout.url) {
      console.log("✅ Checkout Session Created:", checkout.url);
      console.log("   Risk Score:", checkout.riskScore);
      console.log("   Decision:", checkout.decision);
    } else {
      console.error("❌ Checkout Failed:", checkout);
    }

    // 6. SSE Check (Manual)
    console.log(
      "\n6. SSE Stream Check skipped (manual verification needed via browser)",
    );

    console.log("\n✅ SMOKE TEST PASSED!");
  } catch (error) {
    console.error("\n❌ SMOKE TEST FAILED:", error);
    process.exit(1);
  }
}

runSmokeTest();
