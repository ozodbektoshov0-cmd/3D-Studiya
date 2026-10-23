#!/bin/sh
# SKP importi uchun vendor/openskp.min.js ni yig'adi (bir marta bajariladi). Node.js 18+ kerak.
set -e
cd "$(dirname "$0")"
[ -f package.json ] || npm init -y >/dev/null
npm i openskp esbuild
npx esbuild skp-entry.js --bundle --minify --format=iife --platform=browser \
  --external:fs --external:node:fs --external:path --external:node:path \
  --outfile=../vendor/openskp.min.js
cp node_modules/openskp/LICENSE ../vendor/license.openskp.txt 2>/dev/null || echo "LICENSE ni qo'lda vendor/license.openskp.txt ga nusxalang"
echo "Tayyor: vendor/openskp.min.js"
