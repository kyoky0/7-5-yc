#!/usr/bin/env bash
# Starts the enclave built by build-eif.sh. Run on the Nitro-enabled EC2 host.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EIF_PATH="$REPO_ROOT/enclave/enclave.eif"

CPU_COUNT="${ENCLAVE_CPU_COUNT:-2}"
MEMORY_MIB="${ENCLAVE_MEMORY_MIB:-2048}"
ENCLAVE_CID="${ENCLAVE_CID:-16}"

if [ ! -f "$EIF_PATH" ]; then
  echo "error: $EIF_PATH not found -- run scripts/build-eif.sh first" >&2
  exit 1
fi

echo "==> nitro-cli run-enclave (cid=$ENCLAVE_CID cpu=$CPU_COUNT mem=${MEMORY_MIB}MiB)"
nitro-cli run-enclave \
  --cpu-count "$CPU_COUNT" \
  --memory "$MEMORY_MIB" \
  --eif-path "$EIF_PATH" \
  --enclave-cid "$ENCLAVE_CID" \
  "$@"

echo
nitro-cli describe-enclaves
echo
echo "Start the Parent EC2 API:"
echo "  ENCLAVE_TRANSPORT=vsock ENCLAVE_CID=$ENCLAVE_CID ENCLAVE_PORT=5005 npm run start --workspace=@serendipity/parent"
