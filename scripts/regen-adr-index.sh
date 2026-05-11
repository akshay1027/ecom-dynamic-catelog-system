#!/bin/bash
ROOT=/Users/akshayrr/Documents/projects/ecom-dynamic-catelog-system
ADR_DIR="$ROOT/docs/adr"
INDEX="$ADR_DIR/INDEX.md"

{
  echo '# ADR Index'
  echo '_Auto-generated — do not edit manually. Updated by PostToolUse hook whenever an ADR file is written._'
  echo ''
  echo '| ADR | Title | Status |'
  echo '|-----|-------|--------|'
  for f in "$ADR_DIR"/ADR-*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)
    adr_num=$(echo "$name" | grep -oE 'ADR-[0-9]+')
    title=$(grep '^# ' "$f" | head -1 | sed 's/^# ADR-[0-9]*: //')
    status=$(grep '^\*\*Status:\*\*' "$f" | head -1 | sed 's/\*\*Status:\*\* //')
    echo "| [$adr_num]($name.md) | $title | $status |"
  done
} > "$INDEX"

echo "ADR INDEX: Regenerated $INDEX"
