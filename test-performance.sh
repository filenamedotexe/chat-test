#!/bin/bash

echo "Testing Registration Performance..."
echo "Creating 5 users..."

START=$(date +%s%3N)

for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"perftest$i@example.com\",\"password\":\"PerfTest123\",\"name\":\"Perf Test $i\"}" \
    -s -o /dev/null
done

END=$(date +%s%3N)
DURATION=$((END - START))
AVG=$((DURATION / 5))

echo "Total time: ${DURATION}ms"
echo "Average per registration: ${AVG}ms"

echo -e "\nTesting Protected Endpoint Performance..."
for i in {1..10}; do
  time curl -s http://localhost:3000/api/user/me -o /dev/null -w "Response: %{http_code}, Time: %{time_total}s\n"
done