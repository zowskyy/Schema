#!/usr/bin/env bash
# Run cursor_gate via Docker (no local Python deps required)
set -euo pipefail

IMAGE="${CURSOR_GATE_IMAGE:-cursor-gate:latest}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

build_if_missing() {
  if ! docker image inspect "$IMAGE" &>/dev/null; then
    echo "Building $IMAGE..." >&2
    docker build -t "$IMAGE" "$REPO_ROOT"
  fi
}

usage() {
  cat <<EOF
Usage: cursor-gate-docker.sh [--build] [--file PATH | --stdin] [gate options]

Examples:
  ./scripts/cursor-gate-docker.sh --file ./app.py --iterations 3
  echo "print('hi')" | ./scripts/cursor-gate-docker.sh --stdin
  ./scripts/cursor-gate-docker.sh --build --file ./app.py
EOF
}

BUILD=false
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) BUILD=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

if $BUILD; then
  docker build -t "$IMAGE" "$REPO_ROOT"
else
  build_if_missing
fi

ENV_FILE_ARGS=()
[[ -f "$REPO_ROOT/.env" ]] && ENV_FILE_ARGS+=(--env-file "$REPO_ROOT/.env")
[[ -f "$HOME/.cursor/.env" ]] && ENV_FILE_ARGS+=(--env-file "$HOME/.cursor/.env")

FILE_ARG=""
STDIN_MODE=false
for i in "${!ARGS[@]}"; do
  if [[ "${ARGS[$i]}" == "--file" && -n "${ARGS[$i+1]:-}" ]]; then
    FILE_ARG="${ARGS[$i+1]}"
  fi
  if [[ "${ARGS[$i]}" == "--stdin" ]]; then
    STDIN_MODE=true
  fi
done

MOUNT_ARGS=(-v "$REPO_ROOT:/workspace:ro" -v "cursor-gate-logs:/data/gate-logs" -v "cursor-gate-cache:/data/gate-cache")
WORKDIR_ARGS=(-w /workspace)

USE_FASTEST="${CURSOR_GATE_FASTEST:-1}"
if [[ "$USE_FASTEST" == "1" ]]; then
  GATE_SCRIPT="/app/cursor_gate_fastest.py"
else
  GATE_SCRIPT="/app/cursor_gate.py"
fi
DOCKER_ARGS=("$GATE_SCRIPT" "${ARGS[@]}")

if $STDIN_MODE; then
  docker run --rm -i "${ENV_FILE_ARGS[@]}" "${MOUNT_ARGS[@]}" "${WORKDIR_ARGS[@]}" "$IMAGE" "${ARGS[@]}"
elif [[ -n "$FILE_ARG" ]]; then
  # Resolve relative paths inside container workspace mount
  if [[ "$FILE_ARG" != /* ]]; then
  ARGS=("${ARGS[@]/--file $FILE_ARG/--file /workspace/$FILE_ARG}")
  fi
  docker run --rm "${ENV_FILE_ARGS[@]}" "${MOUNT_ARGS[@]}" "${WORKDIR_ARGS[@]}" "$IMAGE" "${ARGS[@]}"
else
  docker run --rm "${ENV_FILE_ARGS[@]}" "${MOUNT_ARGS[@]}" "${WORKDIR_ARGS[@]}" "$IMAGE" "${ARGS[@]}"
fi
