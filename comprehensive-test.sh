#!/bin/bash

# Comprehensive Authentication System Test Suite
# Tests all aspects of the authentication implementation

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔐 Comprehensive Authentication System Test"
echo "=========================================="
echo ""

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper function to test endpoint
test_endpoint() {
    local NAME="$1"
    local METHOD="$2"
    local URL="$3"
    local DATA="$4"
    local EXPECTED_STATUS="$5"
    local EXTRA_HEADERS="$6"
    
    echo -n "Testing: $NAME... "
    
    if [ -n "$DATA" ]; then
        RESPONSE=$(curl -s -X "$METHOD" "$URL" \
            -H "Content-Type: application/json" \
            $EXTRA_HEADERS \
            -d "$DATA" \
            -w "\n__STATUS__%{http_code}")
    else
        RESPONSE=$(curl -s -X "$METHOD" "$URL" \
            $EXTRA_HEADERS \
            -w "\n__STATUS__%{http_code}")
    fi
    
    STATUS=$(echo "$RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
    BODY=$(echo "$RESPONSE" | grep -v "__STATUS__")
    
    if [ "$STATUS" = "$EXPECTED_STATUS" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $STATUS)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $EXPECTED_STATUS, Got: $STATUS)"
        echo "  Response: $BODY"
        ((FAILED++))
        return 1
    fi
}

# Function to create unique test user
create_test_user() {
    local EMAIL="test$(date +%s)@example.com"
    local PASSWORD="TestPass123"
    local NAME="Test User"
    
    echo "$EMAIL"
}

echo "1. DATABASE & SETUP TESTS"
echo "------------------------"

# Test database setup endpoint
test_endpoint "Database Setup Endpoint" "GET" "$BASE_URL/api/setup-auth-database" "" "200"

echo ""
echo "2. REGISTRATION TESTS"
echo "--------------------"

# Test successful registration
EMAIL1=$(create_test_user)
test_endpoint "User Registration - Valid" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"$EMAIL1\",\"password\":\"ValidPass123\",\"name\":\"Valid User\"}" "200"

# Test duplicate email
test_endpoint "User Registration - Duplicate Email" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"$EMAIL1\",\"password\":\"ValidPass123\",\"name\":\"Duplicate User\"}" "409"

# Test invalid email format
test_endpoint "User Registration - Invalid Email" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"invalid-email\",\"password\":\"ValidPass123\",\"name\":\"Invalid Email\"}" "400"

# Test weak password
test_endpoint "User Registration - Weak Password" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"weak@example.com\",\"password\":\"weak\",\"name\":\"Weak Pass\"}" "400"

# Test missing fields
test_endpoint "User Registration - Missing Email" "POST" "$BASE_URL/api/auth/register" \
    "{\"password\":\"ValidPass123\",\"name\":\"No Email\"}" "400"

# Test SQL injection in email
test_endpoint "User Registration - SQL Injection" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"test'; DROP TABLE users; --\",\"password\":\"ValidPass123\",\"name\":\"SQL Test\"}" "400"

echo ""
echo "3. AUTHENTICATION & AUTHORIZATION TESTS"
echo "--------------------------------------"

# Test unauthenticated access to protected routes
test_endpoint "Protected Route - Home" "GET" "$BASE_URL/" "" "307"
test_endpoint "Protected Route - Chat" "GET" "$BASE_URL/chat" "" "307"
test_endpoint "Protected Route - Admin" "GET" "$BASE_URL/admin" "" "307"
test_endpoint "Protected API - User Me" "GET" "$BASE_URL/api/user/me" "" "307"
test_endpoint "Protected API - Admin Users" "GET" "$BASE_URL/api/admin/users" "" "307"
test_endpoint "Protected API - User Apps" "GET" "$BASE_URL/api/user/apps" "" "307"

# Test public routes
test_endpoint "Public Route - Login Page" "GET" "$BASE_URL/login" "" "200"
test_endpoint "Public Route - Register Page" "GET" "$BASE_URL/register" "" "200"

echo ""
echo "4. API ENDPOINT TESTS"
echo "--------------------"

# Test admin endpoints without auth
test_endpoint "Admin API - Users List" "GET" "$BASE_URL/api/admin/users" "" "307"
test_endpoint "Admin API - Chat History" "GET" "$BASE_URL/api/admin/chat-history" "" "307"
test_endpoint "Admin API - Permission Groups" "GET" "$BASE_URL/api/admin/permission-groups" "" "307"
test_endpoint "Admin API - Discover Apps" "POST" "$BASE_URL/api/admin/discover-apps" "" "307"

# Test user endpoints without auth
test_endpoint "User API - Profile" "GET" "$BASE_URL/api/user/me" "" "307"
test_endpoint "User API - Apps" "GET" "$BASE_URL/api/user/apps" "" "307"
test_endpoint "User API - Permissions" "GET" "$BASE_URL/api/user/permissions" "" "307"

echo ""
echo "5. INPUT VALIDATION TESTS"
echo "------------------------"

# Test XSS in registration
test_endpoint "XSS Prevention - Name Field" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"xss@example.com\",\"password\":\"ValidPass123\",\"name\":\"<script>alert('xss')</script>\"}" "400"

# Test long inputs
LONG_EMAIL="a$(printf '%*s' 300 | tr ' ' 'a')@example.com"
test_endpoint "Input Length - Long Email" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"$LONG_EMAIL\",\"password\":\"ValidPass123\",\"name\":\"Long Email\"}" "400"

echo ""
echo "6. PERFORMANCE TESTS"
echo "-------------------"

# Test response times
echo -n "Testing: Response Time - Login Page... "
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/login")
if (( $(echo "$TIME < 0.5" | bc -l) )); then
    echo -e "${GREEN}✓ PASSED${NC} (${TIME}s)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (${TIME}s > 0.5s)"
    ((FAILED++))
fi

echo -n "Testing: Response Time - Protected Route... "
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/user/me")
if (( $(echo "$TIME < 0.1" | bc -l) )); then
    echo -e "${GREEN}✓ PASSED${NC} (${TIME}s)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (${TIME}s > 0.1s)"
    ((FAILED++))
fi

echo ""
echo "7. DATABASE INTEGRITY TESTS"
echo "--------------------------"

# Test if default admin exists
echo -n "Testing: Default Admin User Exists... "
# We can't directly query the database, but we know admin@example.com should exist
test_endpoint "Admin Email Already Exists" "POST" "$BASE_URL/api/auth/register" \
    "{\"email\":\"admin@example.com\",\"password\":\"NewPass123\",\"name\":\"Admin\"}" "409"

echo ""
echo "8. SESSION & MIDDLEWARE TESTS"
echo "----------------------------"

# Test invalid methods
test_endpoint "Invalid Method - GET on POST endpoint" "GET" "$BASE_URL/api/auth/register" "" "405"

# Test CORS headers (if applicable)
echo -n "Testing: CORS Headers... "
HEADERS=$(curl -s -I -X OPTIONS "$BASE_URL/api/auth/register" -H "Origin: https://example.com")
if echo "$HEADERS" | grep -q "access-control-allow-origin"; then
    echo -e "${YELLOW}⚠ WARNING${NC} (CORS headers present - verify configuration)"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ PASSED${NC} (No CORS headers - good for security)"
    ((PASSED++))
fi

echo ""
echo "9. ERROR HANDLING TESTS"
echo "----------------------"

# Test malformed JSON
test_endpoint "Malformed JSON" "POST" "$BASE_URL/api/auth/register" \
    "{invalid json}" "400"

# Test empty body
test_endpoint "Empty Body" "POST" "$BASE_URL/api/auth/register" \
    "" "400"

echo ""
echo "10. CHAT INTEGRATION TESTS"
echo "-------------------------"

# Test chat API requires auth
test_endpoint "Chat API - Requires Auth" "POST" "$BASE_URL/api/chat-langchain" \
    "{\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}" "307"

echo ""
echo "=========================================="
echo "COMPREHENSIVE TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests: $((PASSED + FAILED + WARNINGS))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "The authentication system is working correctly."
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please review the failed tests above."
fi

echo ""
echo "Additional Manual Testing Required:"
echo "- Login flow with actual credentials"
echo "- Admin dashboard functionality"
echo "- Permission management UI"
echo "- Chat history isolation between users"
echo "- App permission enforcement"