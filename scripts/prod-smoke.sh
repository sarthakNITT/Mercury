#!/bin/bash

# Configuration
GATEWAY_URL="http://localhost:4000"

echo "=================================================="
echo "          PRODUCTION SMOKE TEST CHECK"
echo "=================================================="

# 1. Wait for Gateway
echo "[1/6] Waiting for Gateway Health at $GATEWAY_URL..."
ATTEMPTS=0
MAX_ATTEMPTS=10
while ! curl -s "$GATEWAY_URL/health" | grep -q 'ok":true'; do
  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "[ERROR] Gateway not healthy after $MAX_ATTEMPTS attempts."
    exit 1
  fi
  echo "  Waiting... ($ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 5
  ((ATTEMPTS++))
done
echo "  [OK] Gateway is UP."

# 2. Seed Data
echo "[2/6] Seeding system..."
curl -s -X POST "$GATEWAY_URL/seed" > /dev/null
echo "  [OK] Seeding triggered."

# 3. Fetch Products
echo "[3/6] Fetching products..."
PRODUCTS=$(curl -s "$GATEWAY_URL/products")
COUNT=$(echo "$PRODUCTS" | grep -o "id" | wc -l)
if [ "$COUNT" -eq "0" ]; then
    echo "[ERROR] No products found!"
    exit 1
fi
echo "  [OK] Found $COUNT products."

# Get first product ID (hacky bash parsing or node)
PRODUCT_ID=$(echo "$PRODUCTS" | grep -o 'id":"[^"]*' | head -1 | cut -d'"' -f3)

# 4. Recommendations
echo "[4/6] Checking Recommendations for ($PRODUCT_ID)..."
RECO=$(curl -s "$GATEWAY_URL/recommendations/$PRODUCT_ID?userId=prod-smoke")
if echo "$RECO" | grep -q "recommendations"; then
    echo "  [OK] Recommendations returned."
else
    echo "[ERROR] Invalid recommendation response."
    echo "$RECO"
    exit 1
fi

# 5. Metrics Overview
echo "[5/6] Checking Metrics Overview..."
METRICS=$(curl -s "$GATEWAY_URL/metrics/overview")
if echo "$METRICS" | grep -q "totalEvents"; then
    echo "  [OK] Metrics endpoint working."
else
    echo "[ERROR] Metrics endpoint failed."
    exit 1
fi

# 6. Trending
echo "[6/6] Checking Trending..."
TRENDING=$(curl -s "$GATEWAY_URL/trending")
if echo "$TRENDING" | grep -q "items"; then
    echo "  [OK] Trending endpoint working."
else
    echo "[ERROR] Trending endpoint failed."
    exit 1
fi

echo "=================================================="
echo "          PRODUCTION VERIFICATION PASSED"
echo "=================================================="
exit 0
