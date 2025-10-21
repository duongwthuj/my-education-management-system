#!/bin/bash

echo "🔍 Frontend-Backend Integration Verification"
echo "=========================================="
echo ""

echo "1. Checking for remaining mock data imports..."
MOCK_IMPORTS=$(grep -r "import.*from.*@/data" Frontend/src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
if [ "$MOCK_IMPORTS" -eq 0 ]; then
    echo "   ✅ No mock data imports found"
else
    echo "   ❌ Found $MOCK_IMPORTS mock data imports"
fi
echo ""

echo "2. Checking API client exists..."
if [ -f "Frontend/src/lib/api-client.ts" ]; then
    echo "   ✅ API client exists"
else
    echo "   ❌ API client missing"
fi
echo ""

echo "3. Checking service files..."
SERVICES=("teachers" "subjects" "classes" "schedules")
for service in "${SERVICES[@]}"; do
    if [ -f "Frontend/src/services/${service}.service.ts" ]; then
        echo "   ✅ ${service}.service.ts exists"
    else
        echo "   ❌ ${service}.service.ts missing"
    fi
done
echo ""

echo "4. Checking hook files..."
HOOKS=("use-teachers" "use-subjects" "use-classes" "use-schedules")
for hook in "${HOOKS[@]}"; do
    if [ -f "Frontend/src/hooks/${hook}.ts" ]; then
        echo "   ✅ ${hook}.ts exists"
    else
        echo "   ❌ ${hook}.ts missing"
    fi
done
echo ""

echo "5. Checking environment files..."
if [ -f "Frontend/.env.local" ]; then
    echo "   ✅ Frontend .env.local exists"
else
    echo "   ⚠️  Frontend .env.local missing (create before running)"
fi

if [ -f "Backend/.env" ]; then
    echo "   ✅ Backend .env exists"
else
    echo "   ⚠️  Backend .env missing (create before running)"
fi
echo ""

echo "6. Checking component updates..."
COMPONENTS=(
    "Frontend/src/components/teachers/teachers-list.tsx"
    "Frontend/src/components/teachers/teacher-detail.tsx"
    "Frontend/src/components/subjects/subjects-list.tsx"
    "Frontend/src/components/classes/classes-list.tsx"
    "Frontend/src/components/classes/class-card.tsx"
    "Frontend/src/components/schedules/schedules-list.tsx"
    "Frontend/src/components/schedules/schedule-table.tsx"
    "Frontend/src/components/schedules/schedule-calendar.tsx"
    "Frontend/src/app/dashboard/teacher-schedules/page.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        if grep -q "use-teachers\|use-subjects\|use-classes\|use-schedules" "$component"; then
            echo "   ✅ $(basename $component) updated"
        else
            echo "   ⚠️  $(basename $component) may need verification"
        fi
    fi
done
echo ""

echo "=========================================="
echo "Verification Complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Create Frontend/.env.local with NEXT_PUBLIC_API_URL=http://localhost:5000/api"
echo "2. Create Backend/.env with MongoDB connection string"
echo "3. Start Backend: cd Backend && npm run dev"
echo "4. Start Frontend: cd Frontend && npm run dev"
echo "5. Navigate to http://localhost:3000/dashboard and test"
