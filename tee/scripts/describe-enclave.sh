#!/usr/bin/env bash
# Shows status of all running Nitro Enclaves on this host.
set -euo pipefail

nitro-cli describe-enclaves | python3 -m json.tool
