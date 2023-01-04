#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Purpose:
#
# Default mode:
#     Run license-checker to identify any npm packages NOT containing a license file.
#     If any, reports them one per line and returns a non-zero exit code.
#
# --report mode:
#     Output all license data as a tree.
#
# --report-json mode:
#     Output all license data as JSON.

ALLOWED="Apache-2.0;Apache-Style;BSD;BSD*;BSD-2-Clause;BSD-3-Clause;CC0-1.0;CC-BY-3.0;CC-BY-4.0;CC-BY-SA-4.0;ISC;MIT;Python-2.0;Unlicense;WTFPL"

license_checker() {
  # TODO: including some exceptions that should be cleaned up eventually
  npx license-checker --onlyAllow "$ALLOWED" --excludePackages 'vscode-styra@0.0.1;buffers@0.1.1;@tootallnate/once@1.1.2;tr46@0.0.3' "$@"
}

option=${1:-} # default to empty string
if [ "$option" == "--report" ]; then
  license_checker
  exit 0
fi

if [ "$option" == "--report-json" ]; then
  license_checker --json
  exit 0
fi

data=$(license_checker --json)
# Testing: swap in this line and put something useful in testFile.json
# data=$(cat testFile.json)
violations=$(echo "$data" | jq -r 'to_entries[] | select(.value.licenseFile | not) | .key')

if [[ -n $violations ]]; then
  printf '%s\n' "$violations"
  exit 1
fi
exit 0
