#!/usr/bin/env bash
set -euo pipefail

if [ ! -f keys/private.pem ]; then
  bash scripts/generate-dev-keys.sh
fi

node -e '
const fs = require("node:fs");
const crypto = require("node:crypto");

const privateKey = fs.readFileSync("keys/private.pem", "utf-8");
const now = Math.floor(Date.now() / 1000);

const header = {
  alg: "RS256",
  typ: "JWT",
  kid: "wallet-dev-1"
};

const payload = {
  sub: process.argv[1] || "c6b986e3-c23f-4e0a-bdf9-0db7cfad1e32",
  email: "developer@portfolio.local",
  roles: ["USER", "ADMIN"],
  iss: "wallet-api",
  aud: "portfolio",
  iat: now,
  exp: now + 900,
  jti: crypto.randomUUID()
};

function base64Url(str) {
  return Buffer.from(str).toString("base64url");
}

const encodedHeader = base64Url(JSON.stringify(header));
const encodedPayload = base64Url(JSON.stringify(payload));
const data = `${encodedHeader}.${encodedPayload}`;

const signer = crypto.createSign("RSA-SHA256");
signer.update(data);
const signature = signer.sign(privateKey, "base64url");

console.log(`${data}.${signature}`);
' "${1:-c6b986e3-c23f-4e0a-bdf9-0db7cfad1e32}"
