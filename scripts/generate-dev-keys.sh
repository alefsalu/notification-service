#!/usr/bin/env bash
set -euo pipefail

mkdir -p keys

if [ ! -f keys/private.pem ]; then
  echo "Generating RSA 2048 private key in keys/private.pem..."
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out keys/private.pem
fi

if [ ! -f keys/public.pem ]; then
  echo "Extracting RSA 2048 public key to keys/public.pem..."
  openssl rsa -pubout -in keys/private.pem -out keys/public.pem
fi

echo "Keys ready in keys/"
