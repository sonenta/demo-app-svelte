#!/usr/bin/env bash
# deploy.sh — build the SvelteKit demo locally and rsync build/ to sonenta-web
# under https://sonenta.com/demos/svelte/.
#
# Native deploy pattern (parité avec website/scripts/deploy.sh):
#   Box   : sonenta@sonenta-web
#   Root  : /data/clients/sonenta/sonenta.com/demos/svelte
#   Layout: FLAT DOCROOT (case B) — nginx vhost sonenta.com serves
#           /demos/svelte/ from $DEPLOY_ROOT directly (no `current` symlink).
#           rsync build/ → $DEPLOY_ROOT with --delete; sub-second window where
#           new + old files mix is acceptable for a static showcase.
#
# SvelteKit is built with @sveltejs/adapter-static + paths.base=/demos/svelte
# and fallback:'index.html' (see svelte.config.js). The build emits to
# build/, not dist/.
#
# No Docker, no GitHub Actions — build runs HERE, rsync to the box. nginx
# + certbot are already configured on the box. The bundle has no build-time
# secrets (public demo, fetchImpl stubbed for @sonenta/feedback).
#
# Preflights (run before anything else):
#   1. SSH reachability of DEPLOY_SSH_HOST
#   2. Git repo + branch=main + clean tree + in sync with origin/main
#
# Usage:
#   ./scripts/deploy.sh                # build + rsync to flat docroot
#   ./scripts/deploy.sh --reload-nginx # also reload nginx on the box
#   ./scripts/deploy.sh --pull         # if HEAD is behind origin/main, ff-only pull
#   ./scripts/deploy.sh --force-dirty  # deploy even with uncommitted changes (warn)
#   ./scripts/deploy.sh --dry-run      # show what would happen, do nothing
#
# Optional env (sane defaults below):
#   DEPLOY_SSH_HOST   (default: sonenta@sonenta-web)
#   DEPLOY_ROOT       (default: /data/clients/sonenta/sonenta.com/demos/svelte)

set -euo pipefail

# ---- args ----------------------------------------------------------------
RELOAD_NGINX=0
DRY_RUN=0
DO_PULL=0
FORCE_DIRTY=0
for arg in "$@"; do
    case "$arg" in
        --reload-nginx) RELOAD_NGINX=1 ;;
        --dry-run)      DRY_RUN=1 ;;
        --pull)         DO_PULL=1 ;;
        --force-dirty)  FORCE_DIRTY=1 ;;
        -h|--help)
            sed -n '2,32p' "$0"; exit 0 ;;
        *) echo "deploy: unknown arg '$arg'" >&2; exit 2 ;;
    esac
done

run() {
    if [[ $DRY_RUN -eq 1 ]]; then
        echo "+ $*"
    else
        eval "$@"
    fi
}

# ---- locate repo ---------------------------------------------------------
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$REPO_DIR"

if [[ ! -f package.json ]] || ! grep -q '"@sonenta/demo-app-svelte"' package.json; then
    echo "deploy: not in demo-app-svelte repo root (cwd=$REPO_DIR)" >&2
    exit 2
fi

# ---- preflight 1 — SSH reachability --------------------------------------
: "${DEPLOY_SSH_HOST:=sonenta@sonenta-web}"

echo "==> preflight: ssh $DEPLOY_SSH_HOST"
# BatchMode=yes: never prompt (auth must come from agent/key, not interactive).
# ConnectTimeout=5: fail fast on DNS/network issues.
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$DEPLOY_SSH_HOST" 'true' 2>/dev/null; then
    echo "deploy: SSH $DEPLOY_SSH_HOST injoignable. Vérifie ta clé / l'agent SSH avant de relancer." >&2
    exit 2
fi

# ---- preflight 2 — git state ---------------------------------------------
echo "==> preflight: git"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "deploy: not a git repository" >&2
    exit 2
fi

GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$GIT_BRANCH" != "main" ]]; then
    echo "deploy: current branch is '$GIT_BRANCH', expected 'main'." >&2
    echo "        Run \`git switch main\` and try again." >&2
    exit 2
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    if [[ $FORCE_DIRTY -eq 1 ]]; then
        echo "deploy: WARNING — working tree is DIRTY but --force-dirty was passed." >&2
        echo "        Uncommitted changes will NOT be in git history." >&2
    else
        echo "deploy: working tree is dirty (uncommitted changes)." >&2
        echo "        Commit/stash them, or re-run with --force-dirty to ignore." >&2
        exit 2
    fi
fi

# fetch quietly; failure is fatal (offline → can't trust ahead/behind state).
if ! git fetch --quiet origin main; then
    echo "deploy: \`git fetch origin main\` failed — check your network/origin." >&2
    exit 2
fi

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse origin/main)
AHEAD=$(git rev-list --count origin/main..HEAD)
BEHIND=$(git rev-list --count HEAD..origin/main)

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
    : # up to date
elif [[ $BEHIND -gt 0 && $AHEAD -eq 0 ]]; then
    if [[ $DO_PULL -eq 1 ]]; then
        echo "    HEAD is $BEHIND commit(s) behind origin/main — pulling (ff-only)…"
        run "git pull --ff-only origin main"
    else
        echo "deploy: HEAD is $BEHIND commit(s) behind origin/main." >&2
        echo "        Run \`git pull origin main\` or re-run with --pull." >&2
        exit 2
    fi
elif [[ $AHEAD -gt 0 && $BEHIND -eq 0 ]]; then
    echo "    HEAD is $AHEAD commit(s) ahead of origin/main — deploying local commits."
else
    echo "    HEAD has diverged from origin/main ($AHEAD ahead, $BEHIND behind) — deploying local HEAD anyway."
fi

GIT_SHA=$(git rev-parse --short=12 HEAD)
echo "    Déploiement depuis commit $GIT_SHA branch main"

# ---- load operator env (gitignored, optional) ----------------------------
ENV_FILE="$REPO_DIR/deploy/.env.production.local"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; . "$ENV_FILE"; set +a
fi

# ---- defaults ------------------------------------------------------------
: "${DEPLOY_ROOT:=/data/clients/sonenta/sonenta.com/demos/svelte}"

# ---- pick package manager ------------------------------------------------
# Repo ships package-lock.json → npm ci.
if [[ -f pnpm-lock.yaml ]]; then
    if ! command -v pnpm >/dev/null 2>&1; then
        echo "deploy: pnpm not on PATH (repo uses pnpm-lock.yaml)" >&2; exit 2
    fi
    INSTALL=(pnpm install --frozen-lockfile)
    BUILD=(pnpm run build)
elif [[ -f package-lock.json ]]; then
    INSTALL=(npm ci)
    BUILD=(npm run build)
else
    echo "deploy: no lockfile (need package-lock.json or pnpm-lock.yaml)" >&2; exit 2
fi

# ---- build (in a THROWAWAY WORKTREE pinned to $GIT_SHA) -------------------
#
# We build from a clean checkout of the COMMIT, never from the working tree.
# "Deploy the branch" and "deploy the working tree" are NOT the same thing, and
# only one of them is what anyone reviewed. A dirty tree ships code that existed
# in no commit and was reviewed by nobody — demo-app nearly pushed another
# peer's uncommitted LoginForm live, rendering `auth.email.label` as a RAW KEY
# on the page whose whole pitch is catching missing keys. This repo is worse
# still: validation runs routinely leave a `window.__probe_i18n` debug hook and
# fake a11y bundles in the tree.
#
# The clean-tree preflight above is a WARNING (--force-dirty skips it). This is
# a GATE: stray code cannot ship even if someone asks for it.
#
# NOTE (demo-app's trap): a clean checkout has NO gitignored files. This repo
# needs none at build time — `static/cdn/` is gitignored but REGENERATED by the
# `prebuild` hook (scripts/sync-cdn.mjs), and there are no .env secrets. If that
# ever changes, copy them into the worktree explicitly or the build silently
# loses them.
BUILD_TREE="$(mktemp -d -t demo-app-svelte-deploy)"
cleanup_worktree() {
    git worktree remove --force "$BUILD_TREE" 2>/dev/null || rm -rf "$BUILD_TREE"
}
trap cleanup_worktree EXIT

echo "==> checkout $GIT_SHA into a throwaway worktree (NOT the working tree)"
run "git worktree add --detach --force '$BUILD_TREE' '$GIT_SHA'"

echo "==> install"
run "cd '$BUILD_TREE' && ${INSTALL[*]}"

echo "==> build (sha=$GIT_SHA, branch=$GIT_BRANCH)"
run "cd '$BUILD_TREE' && ${BUILD[*]}"

# adapter-static emits to build/ (not dist/). index.html is the SPA shell.
if [[ $DRY_RUN -eq 0 ]] && { [[ ! -d "$BUILD_TREE/build" ]] || [[ ! -f "$BUILD_TREE/build/index.html" ]]; }; then
    echo "deploy: build/ missing or empty after build" >&2; exit 1
fi

# Stamp the bundle with the source commit so `curl /demos/svelte/version.txt`
# confirms what is actually live.
TS=$(date -u +%Y%m%d-%H%M%SZ)
run "printf '%s\n%s\n%s\n' '$GIT_SHA' '$GIT_BRANCH' '$TS' > '$BUILD_TREE/build/version.txt'"

# The deployed artefact SELF-REPORTS the SDK versions it was actually built
# against, read from the worktree's INSTALLED node_modules (not from
# package.json, which is a request, not a fact).
#
# Why: "what SDK does the deploy run?" had no verifiable answer. The provenance
# chain (stamp -> commit -> lockfile -> npm ci) is an ARGUMENT; a curl is a FACT.
# Bundle markers cannot settle it either — i18n-core 1.1.2 and 1.1.8 share every
# string literal, so nothing in the minified bundle distinguishes them. marketing
# was about to send a human to film a build whose SDK version nobody could prove.
#
#   curl https://sonenta.com/demos/svelte/deps.txt
run "node -e \"const fs=require('fs'),p=(n)=>{try{return require(require.resolve(n+'/package.json',{paths:['$BUILD_TREE']})).version}catch(e){return 'ABSENT'}};fs.writeFileSync('$BUILD_TREE/build/deps.txt',['@sonenta/i18n-core','@sonenta/svelte-i18n','@sonenta/feedback','i18next'].map(n=>n+'@'+p(n)).join('\\n')+'\\n')\""

# ---- push ----------------------------------------------------------------
echo "==> rsync → $DEPLOY_SSH_HOST:$DEPLOY_ROOT/"
# Pre-create the deploy root so the first rsync hop doesn't need mkdir -p.
run "ssh '$DEPLOY_SSH_HOST' \"mkdir -p '$DEPLOY_ROOT'\""
# Flat docroot: rsync straight into $DEPLOY_ROOT, --delete to drop stale
# files from the previous build. `build/` (note the trailing slash) copies
# the CONTENTS of build, not the build/ directory itself.
run "rsync -avz --delete --human-readable '$BUILD_TREE/build/' '$DEPLOY_SSH_HOST:$DEPLOY_ROOT/'"

if [[ $RELOAD_NGINX -eq 1 ]]; then
    echo "==> reload nginx"
    run "ssh '$DEPLOY_SSH_HOST' 'sudo nginx -t && sudo systemctl reload nginx'"
else
    echo "    (skipping nginx reload — pass --reload-nginx to also reload)"
fi

echo
echo "Deployed."
echo "  URL    : https://sonenta.com/demos/svelte/"
echo "  Commit : $GIT_SHA ($GIT_BRANCH)"
echo "  Target : $DEPLOY_SSH_HOST:$DEPLOY_ROOT"
echo "  Stamp  : $TS (curl https://sonenta.com/demos/svelte/version.txt to verify)"
