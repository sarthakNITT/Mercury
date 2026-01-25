#!/bin/bash

BASE_URL="http://localhost:4000"

echo "=== REDIS KEYS BEFORE ==="
docker exec lavapunk26-redis-1 redis-cli KEYS "mercury:*"

echo -e "\n=== 1. Create Category ==="
CAT_ID=$(curl -s -X POST $BASE_URL/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "CacheTestCategory"}' | jq -r '.id')
echo "Category ID: $CAT_ID"

echo -e "\n=== 2. Create Product ==="
PROD_ID=$(curl -s -X POST $BASE_URL/products \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"CacheTestProduct\", \"description\": \"Test Description\", \"price\": 5000, \"categoryId\": \"$CAT_ID\", \"currency\": \"INR\", \"stock\": 10}" | jq -r '.id')
echo "Product ID: $PROD_ID"

echo -e "\n=== 3. List Products (Should MISS then HIT) ==="
echo "--- Call 1 ---"
curl -s -D - $BASE_URL/products -o /dev/null | grep -E "x-cache|etag|cache-control"
echo "--- Call 2 ---"
curl -s -D - $BASE_URL/products -o /dev/null | grep -E "x-cache|etag|cache-control"

echo -e "\n=== 4. Product Detail (Should MISS then HIT) ==="
echo "--- Call 1 ---"
curl -s -D - $BASE_URL/products/$PROD_ID -o /dev/null | grep -E "x-cache|etag|cache-control"
echo "--- Call 2 ---"
curl -s -D - $BASE_URL/products/$PROD_ID -o /dev/null | grep -E "x-cache|etag|cache-control"

echo -e "\n=== 5. Update Product (Invalidate) ==="
curl -s -X PATCH $BASE_URL/products/$PROD_ID \
  -H "Content-Type: application/json" \
  -d '{"price": 6000}' | jq -r '.price'

echo -e "\n=== 6. List Products (Should MISS then HIT) ==="
echo "--- Call 1 ---"
curl -s -D - $BASE_URL/products -o /dev/null | grep -E "x-cache|etag|cache-control"
echo "--- Call 2 ---"
curl -s -D - $BASE_URL/products -o /dev/null | grep -E "x-cache|etag|cache-control"

echo -e "\n=== 7. Delete Product ==="
curl -s -X DELETE $BASE_URL/products/$PROD_ID

echo -e "\n=== 8. Verify Deletion ==="
curl -s $BASE_URL/products | grep "$PROD_ID" || echo "Product not found (Good)"

echo -e "\n=== REDIS KEYS AFTER ==="
docker exec lavapunk26-redis-1 redis-cli KEYS "mercury:*"

