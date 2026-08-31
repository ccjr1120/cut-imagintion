#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT_DIR/.env.deploy}"

if [[ ! -f "$ENV_FILE" ]]; then
  printf 'Missing deployment env file: %s\n' "$ENV_FILE" >&2
  printf 'Create it with: cp .env.deploy.example .env.deploy\n' >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-imagintion.gleeze.com}"
DEPLOY_CADDY_CONFIG_PATH="${DEPLOY_CADDY_CONFIG_PATH:-/etc/caddy/Caddyfile}"

if [[ -n "${DEPLOY_PASSWORD:-}" && -n "${DEPLOY_SSH_KEY:-}" ]]; then
  printf 'Set either DEPLOY_PASSWORD or DEPLOY_SSH_KEY, not both.\n' >&2
  exit 1
fi

if [[ -n "${DEPLOY_PASSWORD:-}" ]] && ! command -v sshpass >/dev/null 2>&1; then
  printf 'Password authentication requires sshpass. Install it or use DEPLOY_SSH_KEY.\n' >&2
  exit 1
fi

if [[ -n "${DEPLOY_SSH_KEY:-}" && ! -f "$DEPLOY_SSH_KEY" ]]; then
  printf 'SSH key not found: %s\n' "$DEPLOY_SSH_KEY" >&2
  exit 1
fi

cd "$ROOT_DIR"
npm run build

SSH_ARGS=(
  ssh
  -p "$DEPLOY_PORT"
  -o ConnectTimeout=15
)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_ARGS+=(-i "$DEPLOY_SSH_KEY")
fi

TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
REMOTE_PATH_Q="$(printf '%q' "$DEPLOY_PATH")"

run_ssh() {
  if [[ -n "${DEPLOY_PASSWORD:-}" ]]; then
    SSHPASS="$DEPLOY_PASSWORD" sshpass -e "${SSH_ARGS[@]}" "$@"
  else
    "${SSH_ARGS[@]}" "$@"
  fi
}

run_sudo() {
  local command_text="$*"

  if [[ "$DEPLOY_USER" == "root" ]]; then
    run_ssh "$TARGET" "$command_text"
  elif [[ -n "${DEPLOY_PASSWORD:-}" ]]; then
    printf '%s\n' "$DEPLOY_PASSWORD" | run_ssh "$TARGET" "sudo -S -p '' $command_text"
  else
    run_ssh "$TARGET" "sudo -n $command_text"
  fi
}

ensure_caddy() {
  if run_ssh "$TARGET" "command -v caddy >/dev/null 2>&1"; then
    printf 'Caddy is already installed.\n'
    return
  fi

  if ! run_ssh "$TARGET" "command -v apt-get >/dev/null 2>&1"; then
    printf 'Caddy is missing and automatic installation currently supports Debian/Ubuntu only.\n' >&2
    exit 1
  fi

  printf 'Installing Caddy...\n'
  run_sudo "apt-get update"
  run_sudo "apt-get install -y ca-certificates curl gnupg debian-keyring debian-archive-keyring apt-transport-https"
  run_ssh "$TARGET" "curl --fail --silent --show-error --location https://dl.cloudsmith.io/public/caddy/stable/setup.deb.sh -o /tmp/caddy-setup.sh"
  run_sudo "bash /tmp/caddy-setup.sh"
  run_sudo "apt-get update"
  run_sudo "apt-get install -y caddy"
  run_sudo "rm -f /tmp/caddy-setup.sh"
}

configure_caddy() {
  local config_path_q temp_path config_text
  config_path_q="$(printf '%q' "$DEPLOY_CADDY_CONFIG_PATH")"
  temp_path="/tmp/gu-mengxue-caddy.$$"
  config_text=$(cat <<EOF
$DEPLOY_DOMAIN {
    root * $DEPLOY_PATH
    encode gzip
    try_files {path} /index.html
    file_server
}
EOF
)

  if run_ssh "$TARGET" "test -s $config_path_q" && run_ssh "$TARGET" "grep -Fq '$DEPLOY_DOMAIN' $config_path_q"; then
    printf 'Existing Caddy config for %s found; preserving it.\n' "$DEPLOY_DOMAIN"
  elif run_ssh "$TARGET" "test -s $config_path_q"; then
    printf 'Existing Caddy config has no %s site; appending the site block.\n' "$DEPLOY_DOMAIN"
    printf '\n%s\n' "$config_text" | run_ssh "$TARGET" "cat > $temp_path"
    run_sudo "cat $temp_path >> $config_path_q"
    run_sudo "rm -f $temp_path"
  else
    printf 'Writing Caddy config for %s...\n' "$DEPLOY_DOMAIN"
    printf '%s\n' "$config_text" | run_ssh "$TARGET" "cat > $temp_path"
    run_sudo "install -m 644 $temp_path $config_path_q"
    run_sudo "rm -f $temp_path"
  fi

  if run_ssh "$TARGET" "grep -Fq 'root * /usr/share/caddy' $config_path_q"; then
    printf 'Replacing the default Caddy welcome root with %s...\n' "$DEPLOY_PATH"
    run_sudo "cp $config_path_q ${config_path_q}.bak"
    run_sudo "sed -i 's#root \\* /usr/share/caddy#root * $DEPLOY_PATH#' $config_path_q"
  fi

  run_sudo "caddy validate --config $config_path_q"
  run_sudo "systemctl enable --now caddy"
  if ! run_sudo "systemctl reload caddy"; then
    run_sudo "systemctl restart caddy"
  fi
}

printf 'Preparing %s on %s...\n' "$DEPLOY_PATH" "$TARGET"
run_ssh "$TARGET" "mkdir -p -- $REMOTE_PATH_Q"

printf 'Uploading dist...\n'
tar -C dist -czf - . | run_ssh "$TARGET" "tar -xzf - -C $REMOTE_PATH_Q"

ensure_caddy
configure_caddy

if [[ -n "${DEPLOY_HEALTHCHECK_URL:-}" ]]; then
  printf 'Checking %s...\n' "$DEPLOY_HEALTHCHECK_URL"
  curl --fail --silent --show-error --location --max-time 20 "$DEPLOY_HEALTHCHECK_URL" >/dev/null
fi

printf 'Deploy complete.\n'
