#!/bin/bash

# Test user registration
echo "Testing user registration..."

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser@example.com\",\"password\":\"TestPass123!\",\"name\":\"Test User\"}" \
  -s | python3 -m json.tool

echo -e "\n\nTesting duplicate registration..."
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser@example.com\",\"password\":\"TestPass123!\",\"name\":\"Test User\"}" \
  -s | python3 -m json.tool

echo -e "\n\nTesting weak password..."
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"weakpass@example.com\",\"password\":\"weak\",\"name\":\"Weak Pass\"}" \
  -s | python3 -m json.tool