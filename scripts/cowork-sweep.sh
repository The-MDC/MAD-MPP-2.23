#!/usr/bin/env bash
# cowork-sweep.sh — find MAD Gambit working files stranded on a local disk and move
# them into this repo, which is the single source of truth.
#
#   bash scripts/cowork-sweep.sh <source-folder>            # dry run (default)
#   bash scripts/cowork-sweep.sh <source-folder> --apply     # actually copy
#   bash scripts/cowork-sweep.sh --discover                  # search $HOME for candidates
#
# Runs on macOS and Linux. Copies, never deletes — the source folder is left intact.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SWEEP_DIRS=(PROJECTS TEMPLATES OUTPUTS ABOUT-ME)
BIG_FILE_KB=25600   # 25 MB — flag anything larger, git is the wrong home for it

APPLY=0
SRC=""

for arg in "$@"; do
  case "$arg" in
    --apply)    APPLY=1 ;;
    --discover) SRC="__DISCOVER__" ;;
    -h|--help)  sed -n '2,11p' "$0"; exit 0 ;;
    *)          SRC="$arg" ;;
  esac
done

say()  { printf '%s\n' "$*"; }
rule() { printf '%s\n' "────────────────────────────────────────────────────────────"; }

# ── discover mode ────────────────────────────────────────────────────────────
if [ "$SRC" = "__DISCOVER__" ]; then
  say "Searching \$HOME for folders that look like a Cowork/MAD Gambit working folder…"
  rule
  find "$HOME" -maxdepth 4 -type d \
       \( -iname '*cowork*' -o -iname '*madhat*' -o -iname '*mad-gambit*' \
          -o -iname '*madgambit*' -o -iname '*mad-mpp*' -o -iname '*MAD-Upshot*' \) \
       -not -path '*/.git/*' -not -path '*/node_modules/*' -not -path '*/Library/*' \
       2>/dev/null | while read -r d; do
    n=$(find "$d" -type f -not -path '*/.git/*' 2>/dev/null | wc -l | tr -d ' ')
    sz=$(du -sk "$d" 2>/dev/null | cut -f1)
    printf '  %-60s %6s files  %6s MB\n' "$d" "$n" "$((sz / 1024))"
  done
  rule
  say "Re-run with the folder you want:  bash scripts/cowork-sweep.sh <folder>"
  exit 0
fi

if [ -z "$SRC" ]; then
  say "Usage: bash scripts/cowork-sweep.sh <source-folder> [--apply]"
  say "       bash scripts/cowork-sweep.sh --discover"
  exit 1
fi

SRC="${SRC%/}"
[ -d "$SRC" ] || { say "Not a directory: $SRC"; exit 1; }

say "Source:      $SRC"
say "Destination: $REPO_ROOT"
say "Mode:        $([ "$APPLY" -eq 1 ] && echo 'APPLY (files will be copied)' || echo 'DRY RUN (nothing written)')"
rule

# ── inventory ────────────────────────────────────────────────────────────────
FOUND=0
for d in "${SWEEP_DIRS[@]}"; do
  if [ -d "$SRC/$d" ]; then
    n=$(find "$SRC/$d" -type f -not -name '.DS_Store' | wc -l | tr -d ' ')
    sz=$(du -sk "$SRC/$d" 2>/dev/null | cut -f1)
    printf '  %-14s %6s files  %6s MB\n' "$d/" "$n" "$((sz / 1024))"
    FOUND=$((FOUND + n))
  else
    printf '  %-14s %s\n' "$d/" "— not present"
  fi
done
rule
say "$FOUND file(s) found."
[ "$FOUND" -eq 0 ] && { say "Nothing to sweep."; exit 0; }

# ── oversized files ──────────────────────────────────────────────────────────
say ""
say "Files over 25 MB (link these, do not commit them):"
BIG=0
for d in "${SWEEP_DIRS[@]}"; do
  [ -d "$SRC/$d" ] || continue
  while IFS= read -r f; do
    kb=$(du -k "$f" | cut -f1)
    if [ "$kb" -gt "$BIG_FILE_KB" ]; then
      printf '  %6s MB  %s\n' "$((kb / 1024))" "${f#$SRC/}"
      BIG=$((BIG + 1))
    fi
  done < <(find "$SRC/$d" -type f -not -name '.DS_Store')
done
[ "$BIG" -eq 0 ] && say "  none"

# ── secret scan ──────────────────────────────────────────────────────────────
say ""
say "Possible credentials (review every hit before committing):"
PATTERNS='(ghp_|github_pat_|gho_|ghs_)[A-Za-z0-9_]{20,}|vcp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|postgres(ql)?://[^ ]+:[^ @]+@|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
HITS=0
for d in "${SWEEP_DIRS[@]}"; do
  [ -d "$SRC/$d" ] || continue
  while IFS= read -r line; do
    printf '  %s\n' "$line"
    HITS=$((HITS + 1))
  done < <(grep -rEIl "$PATTERNS" "$SRC/$d" 2>/dev/null | sed "s|^$SRC/||")
done
if [ "$HITS" -eq 0 ]; then
  say "  none detected"
else
  say ""
  say "  ⚠️  $HITS file(s) matched. Strip or rotate before committing — git history is forever."
fi

# ── copy ─────────────────────────────────────────────────────────────────────
say ""
if [ "$APPLY" -eq 0 ]; then
  rule
  say "Dry run complete. Nothing was written."
  say "Re-run with --apply to copy these into $REPO_ROOT"
  exit 0
fi

if [ "$HITS" -gt 0 ]; then
  printf '  %s files matched the credential scan. Copy anyway? [y/N] ' "$HITS"
  read -r reply
  case "$reply" in [yY]*) ;; *) say "Aborted."; exit 1 ;; esac
fi

for d in "${SWEEP_DIRS[@]}"; do
  [ -d "$SRC/$d" ] || continue
  mkdir -p "$REPO_ROOT/$d"
  # -n: never overwrite anything already in the repo. Repo wins.
  cp -Rn "$SRC/$d/." "$REPO_ROOT/$d/" 2>/dev/null || true
  say "  copied $d/"
done
find "$REPO_ROOT" -name '.DS_Store' -delete 2>/dev/null || true

rule
say "Done. Next:"
say "  cd $REPO_ROOT"
say "  git status          # read this carefully"
say "  git add PROJECTS TEMPLATES OUTPUTS ABOUT-ME"
say "  git commit -m 'chore: migrate local Cowork folders into canonical repo'"
say "  git push"
