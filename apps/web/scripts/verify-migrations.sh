#!/bin/bash
# Verification script for Prisma migrations
# Run this after completing migration execution

set -e

echo "=== Prisma Migration Verification ==="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Migrations directory exists
echo -n "Checking migrations directory... "
if [ -d "apps/web/prisma/migrations" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

# Check 2: Migration count (expect 8+)
echo -n "Checking migration count (expect 8+)... "
MIGRATION_COUNT=$(ls apps/web/prisma/migrations/ | wc -l)
if [ "$MIGRATION_COUNT" -ge 8 ]; then
    echo -e "${GREEN}PASS${NC} ($MIGRATION_COUNT migrations)"
else
    echo -e "${YELLOW}WARN${NC} ($MIGRATION_COUNT migrations, expected 8+)"
fi

# Check 3: Prisma Client generated
echo -n "Checking Prisma Client types... "
if [ -f "node_modules/.prisma/client/index.d.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Run: cd apps/web && npx prisma generate"
    exit 1
fi

# Check 4: FinancialReport type exists
echo -n "Checking FinancialReport type... "
if grep -q "export type FinancialReport" node_modules/.prisma/client/index.d.ts 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${YELLOW}WARN${NC} - FinancialReport type not found (schema incomplete?)"
fi

# Check 5: Schema model count (expect 42)
echo -n "Checking schema model count (expect 42)... "
MODEL_COUNT=$(grep -c "^model " apps/web/prisma/schema.prisma)
if [ "$MODEL_COUNT" -eq 42 ]; then
    echo -e "${GREEN}PASS${NC} ($MODEL_COUNT models)"
else
    echo -e "${YELLOW}WARN${NC} ($MODEL_COUNT models, expected 42)"
fi

# Check 6: db.ts exists
echo -n "Checking db.ts... "
if [ -f "apps/web/src/lib/db.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

# Check 7: health endpoint exists
echo -n "Checking health endpoint... "
if [ -f "apps/web/src/app/api/health/route.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

echo ""
echo "=== Verification Complete ==="
echo "To view schema: cd apps/web && npx prisma studio"
