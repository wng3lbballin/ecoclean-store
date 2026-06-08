#!/bin/sh

API_URL="${API_URL:-/api}"
echo "Generating runtime config: API_URL=${API_URL}"

cat > /usr/share/nginx/html/config.js << EOF
window.__API_URL__ = "${API_URL}";
EOF

echo "Starting nginx..."
exec nginx -g "daemon off;"
