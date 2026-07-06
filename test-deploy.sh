#!/bin/bash
set -e

echo "=== Build Test ==="
npm run build
echo "✓ Build successful"

echo ""
echo "=== Test Suite ==="
npm test
echo "✓ All tests pass"

echo ""
echo "=== Server Start Test ==="
timeout 5 npm start &
SERVER_PID=$!
sleep 3

if curl -fsS http://localhost:3000/health > /dev/null 2>&1; then
  echo "✓ Server starts and responds to health checks"
else
  echo "✗ Server health check failed"
  exit 1
fi

kill $SERVER_PID 2>/dev/null || true

echo ""
echo "=== ✓ All verification checks passed ==="
