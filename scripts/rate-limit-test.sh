#!/bin/bash

# Configuration
API_URL="http://localhost:4000"

echo "=================================================="
echo "          RATE LIMIT TEST SUITE"
echo "=================================================="

# 1. Seed the system
echo "[INFO] Seeding system..."
curl -s -X POST "$API_URL/seed" > /dev/null

# 2. Fetch valid Product ID
echo "[INFO] Fetching valid Product ID..."
# Fetch products and extract the first ID using node
PRODUCT_ID=$(curl -s "$API_URL/products" | node -e '
  try {
    const input = require("fs").readFileSync(0, "utf-8");
    const data = JSON.parse(input);
    const item = Array.isArray(data) ? data[0] : data.products?.[0] || data;
    if (item && item.id) console.log(item.id);
    else process.exit(1);
  } catch (e) { process.exit(1); }
')

if [ -z "$PRODUCT_ID" ]; then
  echo "[ERROR] Failed to fetch valid Product ID."
  exit 1
fi
echo "[OK] Product ID: $PRODUCT_ID"

# 3. Fetch valid User ID
echo "[INFO] Fetching valid User ID..."
# Try to get from recent events
USER_ID=$(curl -s "$API_URL/events/recent?limit=1" | node -e '
  try {
    const input = require("fs").readFileSync(0, "utf-8");
    const data = JSON.parse(input);
    const item = Array.isArray(data) ? data[0] : data.events?.[0];
    if (item && item.userId) console.log(item.userId);
  } catch (e) { }
')

if [ -z "$USER_ID" ]; then
  echo "[WARN] No recent events found. Creating new user activity..."
  USER_ID="test-user-1"
  # Create a VIEW event to ensure user is registered in system if needed, or just to have data
  curl -s -X POST "$API_URL/events" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"VIEW\",\"userId\":\"$USER_ID\",\"productId\":\"$PRODUCT_ID\"}" > /dev/null
fi
echo "[OK] User ID: $USER_ID"

echo ""
echo "Starting Rate Limit Loop..."

# Test 1: Checkout Endpoint (Limit: 20 req/min)
# Loop 25 times
echo "--------------------------------------------------"
echo "TEST 1: Checkout Endpoint (Limit: 20 req/min)"
echo "Sending 25 requests..."
echo "--------------------------------------------------"

for i in {1..25}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/checkout" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$USER_ID\", \"productId\": \"$PRODUCT_ID\"}")
  echo -n "$STATUS "
done
echo ""
echo ""

# Test 2: Risk Endpoint (Limit: 60 req/min)
# Loop 70 times
echo "--------------------------------------------------"
echo "TEST 2: Risk Endpoint (Limit: 60 req/min)"
echo "Sending 70 requests..."
echo "--------------------------------------------------"

for i in {1..70}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/risk" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$USER_ID\", \"productId\": \"$PRODUCT_ID\", \"amount\": 200000}")
  echo -n "$STATUS "
done

echo ""
echo ""
echo "=================================================="
echo "          TEST COMPLETE"
echo "=================================================="
