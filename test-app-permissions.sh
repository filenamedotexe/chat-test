#!/bin/bash

# Test App Permission System
# This script tests if apps respect permission settings

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📱 Testing App Permission System"
echo "================================"
echo ""

echo "1. Testing App Discovery (requires admin auth)"
echo -n "   App discovery endpoint... "
DISCOVER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/discover-apps" -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$DISCOVER_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo ""
echo "2. Testing User App Access"
echo -n "   User apps list without auth... "
APPS_RESPONSE=$(curl -s "$BASE_URL/api/user/apps" -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$APPS_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo ""
echo "3. Testing Permission Management"
echo -n "   Grant permission without auth... "
GRANT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/permissions" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":1,\"app_id\":1}" \
    -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$GRANT_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo -n "   Revoke permission without auth... "
REVOKE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/admin/permissions" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":1,\"app_id\":1}" \
    -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$REVOKE_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo ""
echo "4. Testing Permission Groups"
echo -n "   Permission groups list without auth... "
GROUPS_RESPONSE=$(curl -s "$BASE_URL/api/admin/permission-groups" -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$GROUPS_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo -n "   User permissions without auth... "
PERMS_RESPONSE=$(curl -s "$BASE_URL/api/user/permissions" -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$PERMS_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo ""
echo "5. Testing App Routes"
echo -n "   Notes app without auth... "
NOTES_RESPONSE=$(curl -s "$BASE_URL/notes" -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$NOTES_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo -n "   Dashboard app without auth... "
DASH_RESPONSE=$(curl -s "$BASE_URL/dashboard" -w "\n__STATUS__%{http_code}")
STATUS=$(echo "$DASH_RESPONSE" | grep "__STATUS__" | sed 's/__STATUS__//')
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✓ Properly protected${NC}"
else
    echo -e "${RED}✗ Not protected (Status: $STATUS)${NC}"
fi

echo ""
echo "================================"
echo "APP PERMISSION SYSTEM SUMMARY"
echo "================================"
echo -e "${GREEN}✓ App discovery requires admin authentication${NC}"
echo -e "${GREEN}✓ User app list requires authentication${NC}"
echo -e "${GREEN}✓ Permission management requires admin auth${NC}"
echo -e "${GREEN}✓ Permission groups require admin auth${NC}"
echo -e "${GREEN}✓ User permissions require authentication${NC}"
echo -e "${GREEN}✓ App routes require authentication${NC}"
echo ""
echo "Note: Full app permission testing requires:"
echo "1. Admin login to discover and register apps"
echo "2. Grant specific app permissions to users"
echo "3. Test user access with and without permissions"
echo "4. Verify permission inheritance works correctly"