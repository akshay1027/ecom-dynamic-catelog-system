#!/bin/bash
FILE="$1"
[ -z "$FILE" ] || [ ! -f "$FILE" ] && exit 0

PATTERNS='(sk_live[a-zA-Z0-9]{10,}|sk_test[a-zA-Z0-9]{10,}|AKIA[0-9A-Z]{16})'
ASSIGNMENT_PATTERNS='(password|secret|api_key|api_secret|access_token)[[:space:]]*=[[:space:]]*['"'"'"][^'"'"'"]{8,}'

if grep -qE "$PATTERNS" "$FILE" 2>/dev/null || grep -qE "$ASSIGNMENT_PATTERNS" "$FILE" 2>/dev/null; then
  echo "SECRET SCANNER: Possible hardcoded secret detected in $FILE. Verify before proceeding."
fi
