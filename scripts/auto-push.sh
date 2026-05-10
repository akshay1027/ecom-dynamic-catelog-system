#!/bin/bash
ROOT=/Users/akshayrr/Documents/projects/ecom-dynamic-catelog-system
cd "$ROOT" || exit 0

if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null || [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git add -A -- ':!*.env' ':!.env*' ':!**/.env' ':!**/.env*' 2>/dev/null
  git commit -m "chore: auto-checkpoint $(date +%Y-%m-%dT%H:%M)" 2>/dev/null || true
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -n "$BRANCH" ] && [ "$BRANCH" != "HEAD" ]; then
  git push origin "$BRANCH" 2>/dev/null || true
fi
