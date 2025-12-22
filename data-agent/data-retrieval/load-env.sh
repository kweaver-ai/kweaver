#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   source ./load-env.sh
#
# Notes:
# - This script MUST be sourced to export vars into your current shell.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# Set PYTHONPATH (macOS/Linux uses ':')
export PYTHONPATH="${SCRIPT_DIR}/src:${SCRIPT_DIR}/tests${PYTHONPATH:+:${PYTHONPATH}}"
echo "Set PYTHONPATH=${PYTHONPATH}"


