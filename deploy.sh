#!/bin/bash
# ============================================
# Personal website deploy script
# Live domain: https://gfm156.com
# ============================================

set -e

SERVER_HOST="stratagy"
PUBLIC_REMOTE_DIR="/www/wwwroot/www.gfm156.com"
ADMIN_REMOTE_DIR="/www/wwwroot/write.gfm156.com"
RUNTIME_REMOTE_DIR="/www/wwwdata/blog-runtime"
STORAGE_REMOTE_DIR="/www/wwwdata/blog-source"
RUNTIME_BUILDER_REMOTE_DIR="${ADMIN_REMOTE_DIR}/runtime-builder"
PUBLIC_NGINX_REMOTE_FILE="/www/server/panel/vhost/nginx/www.gfm156.com.conf"
WRITE_NGINX_REMOTE_FILE="/www/server/panel/vhost/nginx/write.gfm156.com.conf"

echo "=========================================="
echo "  Deploy personal website - gfm156.com"
echo "=========================================="

echo ""
echo "[1/5] Building production assets..."
npm run build

echo ""
echo "[2/5] Building bootstrap blog runtime ..."
npm run build:blog-runtime

echo ""
echo "[3/5] Preparing remote directories ..."
ssh ${SERVER_HOST} "mkdir -p \
  ${PUBLIC_REMOTE_DIR} \
  ${ADMIN_REMOTE_DIR}/api \
  ${ADMIN_REMOTE_DIR}/seeds/blog-runtime \
  ${RUNTIME_BUILDER_REMOTE_DIR}/scripts \
  ${RUNTIME_BUILDER_REMOTE_DIR}/src/data \
  ${RUNTIME_BUILDER_REMOTE_DIR}/src/lib/blog \
  /www/server/panel/vhost/nginx/extension/write.gfm156.com \
  /www/server/panel/vhost/nginx/well-known \
  ${RUNTIME_REMOTE_DIR} \
  ${STORAGE_REMOTE_DIR}/articles \
  ${STORAGE_REMOTE_DIR}/assets"

ssh ${SERVER_HOST} "touch /www/server/panel/vhost/nginx/well-known/write.gfm156.com.conf"
ssh ${SERVER_HOST} "ln -sfn ${ADMIN_REMOTE_DIR} ${PUBLIC_REMOTE_DIR}/write"

echo ""
echo "[4/5] Uploading public app, admin app, API, and seed runtime ..."
scp -r dist/* ${SERVER_HOST}:${PUBLIC_REMOTE_DIR}/
scp -r dist/* ${SERVER_HOST}:${ADMIN_REMOTE_DIR}/
scp -r server/blog-admin/api/* ${SERVER_HOST}:${ADMIN_REMOTE_DIR}/api/
scp -r server/seeds/blog-runtime/* ${SERVER_HOST}:${ADMIN_REMOTE_DIR}/seeds/blog-runtime/
scp -r server/seeds/blog-runtime/* ${SERVER_HOST}:${RUNTIME_REMOTE_DIR}/
scp package.json ${SERVER_HOST}:${RUNTIME_BUILDER_REMOTE_DIR}/package.json
scp scripts/build-blog-runtime.mjs ${SERVER_HOST}:${RUNTIME_BUILDER_REMOTE_DIR}/scripts/build-blog-runtime.mjs
scp src/data/blogSeed.js ${SERVER_HOST}:${RUNTIME_BUILDER_REMOTE_DIR}/src/data/blogSeed.js
scp src/data/projects.js ${SERVER_HOST}:${RUNTIME_BUILDER_REMOTE_DIR}/src/data/projects.js
scp src/lib/blog/runtime.js ${SERVER_HOST}:${RUNTIME_BUILDER_REMOTE_DIR}/src/lib/blog/runtime.js

if ssh ${SERVER_HOST} "test -d /etc/letsencrypt/live/write.gfm156.com"; then
  echo "Detected live write.gfm156.com certificate; syncing final subdomain nginx configs ..."
  scp nginx/www.gfm156.com.after-write-cutover.conf ${SERVER_HOST}:${PUBLIC_NGINX_REMOTE_FILE}
  scp nginx/write.gfm156.com.conf ${SERVER_HOST}:${WRITE_NGINX_REMOTE_FILE}
else
  echo "write.gfm156.com certificate not present yet; keeping the temporary /write setup and syncing the bootstrap vhost ..."
  scp nginx/www.gfm156.com.conf ${SERVER_HOST}:${PUBLIC_NGINX_REMOTE_FILE}
  scp nginx/write.gfm156.com.bootstrap.conf ${SERVER_HOST}:${WRITE_NGINX_REMOTE_FILE}
fi

ssh ${SERVER_HOST} "chown -R www:www \
  ${RUNTIME_REMOTE_DIR} \
  ${STORAGE_REMOTE_DIR} \
  ${ADMIN_REMOTE_DIR}/seeds/blog-runtime"

echo ""
echo "[5/5] Reloading live nginx process..."
ssh ${SERVER_HOST} "/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload"

echo ""
echo "=========================================="
echo "  Deploy finished"
echo "  Site: https://gfm156.com"
echo "=========================================="
