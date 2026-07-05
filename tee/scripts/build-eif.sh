#!/usr/bin/env bash
# Builds the enclave Docker image and converts it into a Nitro Enclave Image
# File (EIF). Run on the Nitro-enabled EC2 host (nitro-cli only runs there).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="serendipity-match-enclave:latest"
EIF_PATH="$REPO_ROOT/enclave/enclave.eif"
MEASUREMENTS_PATH="$REPO_ROOT/enclave/measurements.json"

echo "==> docker build ($IMAGE_TAG)"
docker build -t "$IMAGE_TAG" -f "$REPO_ROOT/enclave/Dockerfile" "$REPO_ROOT"

echo "==> nitro-cli build-enclave"
nitro-cli build-enclave \
  --docker-uri "$IMAGE_TAG" \
  --output-file "$EIF_PATH" \
  | tee "$MEASUREMENTS_PATH"

echo
echo "==> wrote $EIF_PATH"
echo "==> wrote $MEASUREMENTS_PATH"
echo "    (this is the real PCR0/1/2 measurement of the built image --"
echo "     enclave/src/attestation/measurement.ts loads it at runtime)"
