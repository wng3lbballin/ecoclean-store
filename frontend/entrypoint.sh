#!/bin/sh

BACKEND_HOST="${BACKEND_HOST:-backend}"
echo "entrypoint: BACKEND_HOST=${BACKEND_HOST}"

sed -i.bak "s/__BACKEND_HOST__/${BACKEND_HOST}/g" /etc/nginx/conf.d/default.conf
rm -f /etc/nginx/conf.d/default.conf.bak

echo "entrypoint: nginx config ready, starting..."
exec nginx -g "daemon off;"
