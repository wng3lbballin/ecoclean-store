#!/bin/sh
set -e

BACKEND_HOST="${BACKEND_HOST:-backend}"
echo "Configuring nginx to proxy /api to ${BACKEND_HOST}:4000"

sed -i.bak "s/__BACKEND_HOST__/${BACKEND_HOST}/g" /etc/nginx/conf.d/default.conf
rm -f /etc/nginx/conf.d/default.conf.bak

exec nginx -g "daemon off;"
