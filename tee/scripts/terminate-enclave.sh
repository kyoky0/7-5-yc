#!/usr/bin/env bash
# Terminates all running Nitro Enclaves on this host.
set -euo pipefail

echo "==> terminating all enclaves"
nitro-cli terminate-enclave --all
echo "==> done"
nitro-cli describe-enclaves
