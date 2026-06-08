#!/bin/sh
set -e

BACKEND_HOST="${BACKEND_HOST:-backend}"
echo "Configuring nginx to proxy /api to ${BACKEND_HOST}:4000"

sed -i "s/__BACKEND_HOST__/${BACKEND_HOST}/g" /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
