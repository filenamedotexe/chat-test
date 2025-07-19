#\!/bin/bash

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔐 Manual Authentication Flow Test"
echo "=================================="
echo ""

# 1. Get CSRF Token
echo "1. Getting CSRF Token..."
CSRF_RESPONSE=$(curl -s -c cookies.txt "$BASE_URL/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "   CSRF Token: ${CSRF_TOKEN:0:20}..."

# 2. Login as Admin
echo ""
echo "2. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -b cookies.txt -c cookies.txt \
  -X POST "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@example.com&password=admin123&csrfToken=$CSRF_TOKEN&json=true" \
  -w "\n__STATUS__%{http_code}")

STATUS=$(echo "$LOGIN_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "302" ] || [ "$STATUS" = "200" ]; then
    echo -e "   ${GREEN}✓ Login successful${NC}"
else
    echo -e "   ${RED}✗ Login failed (Status: $STATUS)${NC}"
fi

# 3. Get Session
echo ""
echo "3. Getting session info..."
SESSION_RESPONSE=$(curl -s -b cookies.txt "$BASE_URL/api/auth/session")
USER_EMAIL=$(echo "$SESSION_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
USER_ROLE=$(echo "$SESSION_RESPONSE" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER_EMAIL" ]; then
    echo -e "   ${GREEN}✓ Session active${NC}"
    echo "   Email: $USER_EMAIL"
    echo "   Role: $USER_ROLE"
else
    echo -e "   ${RED}✗ No session found${NC}"
fi

# 4. Test Admin Access
echo ""
echo "4. Testing admin access..."
ADMIN_USERS=$(curl -s -b cookies.txt "$BASE_URL/api/admin/users" -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$ADMIN_USERS" | grep "__STATUS__" | sed 's/__STATUS__//')

if [ "$STATUS" = "200" ]; then
    USER_COUNT=$(echo "$ADMIN_USERS" | grep -o '"id":' | wc -l)
    echo -e "   ${GREEN}✓ Admin API accessible${NC}"
    echo "   Found $USER_COUNT users in system"
else
    echo -e "   ${RED}✗ Admin API blocked (Status: $STATUS)${NC}"
fi

# 5. Test Chat API
echo ""
echo "5. Testing chat API..."
CHAT_RESPONSE=$(curl -s -b cookies.txt \
  -X POST "$BASE_URL/api/chat-langchain" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"sessionId":"test_session"}' \
  -w "\n__STATUS__%{http_code}")

STATUS=$(echo "$CHAT_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "200" ]; then
    echo -e "   ${GREEN}✓ Chat API accessible${NC}"
else
    echo -e "   ${RED}✗ Chat API failed (Status: $STATUS)${NC}"
fi

# 6. Create Regular User
echo ""
echo "6. Creating regular user..."
TIMESTAMP=$(date +%s)
REG_RESPONSE=$(curl -s -b cookies.txt \
  -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser_${TIMESTAMP}@example.com\",\"password\":\"TestUser123\",\"name\":\"Test User\"}")

if echo "$REG_RESPONSE" | grep -q '"success":true'; then
    echo -e "   ${GREEN}✓ User created${NC}"
    NEW_USER_ID=$(echo "$REG_RESPONSE" | grep -o '"id":[0-9]*' | cut -d: -f2)
    echo "   User ID: $NEW_USER_ID"
else
    echo -e "   ${RED}✗ User creation failed${NC}"
fi

# 7. Test Permission Management
echo ""
echo "7. Testing permission management..."
if [ -n "$NEW_USER_ID" ]; then
    PERM_RESPONSE=$(curl -s -b cookies.txt \
      -X PUT "$BASE_URL/api/admin/users/$NEW_USER_ID/permission-group" \
      -H "Content-Type: application/json" \
      -d '{"permission_group":"power_user"}' \
      -w "\n__STATUS__%{http_code}")
    
    STATUS=$(echo "$PERM_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
    if [ "$STATUS" = "200" ]; then
        echo -e "   ${GREEN}✓ Permission group updated${NC}"
    else
        echo -e "   ${RED}✗ Permission update failed (Status: $STATUS)${NC}"
    fi
fi

# 8. Test Logout
echo ""
echo "8. Testing logout..."
LOGOUT_RESPONSE=$(curl -s -b cookies.txt -c cookies.txt \
  -X POST "$BASE_URL/api/auth/signout" \
  -w "\n__STATUS__%{http_code}")

STATUS=$(echo "$LOGOUT_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "302" ] || [ "$STATUS" = "200" ]; then
    echo -e "   ${GREEN}✓ Logout successful${NC}"
else
    echo -e "   ${RED}✗ Logout failed (Status: $STATUS)${NC}"
fi

# 9. Verify logout worked
echo ""
echo "9. Verifying logout..."
SESSION_CHECK=$(curl -s -b cookies.txt "$BASE_URL/api/auth/session")
if echo "$SESSION_CHECK" | grep -q '"user":null'; then
    echo -e "   ${GREEN}✓ Session cleared${NC}"
else
    echo -e "   ${RED}✗ Session still active${NC}"
fi

# Cleanup
rm -f cookies.txt

echo ""
echo "=================================="
echo "Manual Authentication Test Complete"
echo "=================================="
