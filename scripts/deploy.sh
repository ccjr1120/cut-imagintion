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
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"
: "${SESSION_SECRET:?SESSION_SECRET is required}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-imagintion.gleeze.com}"
DEPLOY_APP_PORT="${DEPLOY_APP_PORT:-3100}"
DEPLOY_SERVICE_NAME="${DEPLOY_SERVICE_NAME:-imagintion}"
DEPLOY_CADDY_CONFIG_PATH="${DEPLOY_CADDY_CONFIG_PATH:-/etc/caddy/Caddyfile}"
DEPLOY_CADDY_SITE_PATH="${DEPLOY_CADDY_SITE_PATH:-/etc/caddy/conf.d/$DEPLOY_SERVICE_NAME.caddy}"

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

SSH_ARGS=(ssh -p "$DEPLOY_PORT" -o ConnectTimeout=15)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then SSH_ARGS+=(-i "$DEPLOY_SSH_KEY"); fi
# Keep the control socket private to this invocation. A fixed path can be
# claimed by an abandoned master process and cause multiplexed sessions to be
# refused even when a direct SSH connection works.
SSH_CONTROL_PATH="/tmp/gmx-deploy-$$-%C"
SSH_ARGS+=(
  -o ControlMaster=auto
  -o ControlPersist=120
  -o ControlPath="$SSH_CONTROL_PATH"
)
TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

cleanup_ssh() {
  "${SSH_ARGS[@]}" -O exit "$TARGET" >/dev/null 2>&1 || true
}
trap cleanup_ssh EXIT

run_ssh() {
  local attempt=1 status
  while (( attempt <= 4 )); do
    if [[ -n "${DEPLOY_PASSWORD:-}" ]]; then
      SSHPASS="$DEPLOY_PASSWORD" sshpass -e "${SSH_ARGS[@]}" "$@" && return 0
    else
      "${SSH_ARGS[@]}" "$@" && return 0
    fi
    status=$?
    if (( status != 255 || attempt == 4 )); then return "$status"; fi
    printf 'SSH connection interrupted; retrying (%s/4)...\n' "$((attempt + 1))" >&2
    sleep "$((attempt * 2))"
    attempt=$((attempt + 1))
  done
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

dotenv_value() {
  local value="$1"
  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    printf 'Environment values cannot contain newlines.\n' >&2
    exit 1
  fi
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

cd "$ROOT_DIR"
npm run build
rm -rf .deploy
cp -R .next/standalone .deploy
mkdir -p .deploy/.next
cp -R .next/static .deploy/.next/static
cp -R public .deploy/public

if ! run_ssh "$TARGET" "true"; then
  printf 'Unable to establish an SSH connection to %s.\n' "$TARGET" >&2
  exit 1
fi
if ! run_ssh "$TARGET" "command -v node >/dev/null 2>&1"; then
  printf 'Node.js 22+ is required on the server.\n' >&2
  exit 1
fi
run_ssh "$TARGET" "mkdir -p '$DEPLOY_PATH/app' '$DEPLOY_PATH/shared/media' '$DEPLOY_PATH/shared/data'"
# macOS tar otherwise stores Apple extended attributes that GNU tar on the
# server does not understand (for example, LIBARCHIVE.xattr.com.apple.provenance).
COPYFILE_DISABLE=1 tar -C .deploy -czf - . | run_ssh "$TARGET" "find '$DEPLOY_PATH/app' -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + && tar -xzf - -C '$DEPLOY_PATH/app'"
if ! run_ssh "$TARGET" "test -f '$DEPLOY_PATH/shared/data/portfolio.json'"; then
  run_ssh "$TARGET" "cat > '$DEPLOY_PATH/shared/data/portfolio.json'" < data/portfolio.json
fi

ENV_TEMP="/tmp/${DEPLOY_SERVICE_NAME}.env.$$"
SERVICE_TEMP="/tmp/${DEPLOY_SERVICE_NAME}.service.$$"
CADDY_TEMP="/tmp/${DEPLOY_SERVICE_NAME}.caddy.$$"
{
  printf 'NODE_ENV=production\nPORT=%s\nHOSTNAME=127.0.0.1\n' "$DEPLOY_APP_PORT"
  printf 'ADMIN_PASSWORD=%s\nSESSION_SECRET=%s\n' "$(dotenv_value "$ADMIN_PASSWORD")" "$(dotenv_value "$SESSION_SECRET")"
  printf 'PORTFOLIO_DATA_FILE=%s/shared/data/portfolio.json\n' "$DEPLOY_PATH"
  printf 'PORTFOLIO_MEDIA_DIR=%s/shared/media\n' "$DEPLOY_PATH"
} | run_ssh "$TARGET" "cat > '$ENV_TEMP'"

cat <<EOF | run_ssh "$TARGET" "cat > '$SERVICE_TEMP'"
[Unit]
Description=Gu Mengxue Portfolio
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$DEPLOY_PATH/app
EnvironmentFile=$DEPLOY_PATH/app/.env.production
ExecStart=/usr/bin/env node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat <<EOF | run_ssh "$TARGET" "cat > '$CADDY_TEMP'"
$DEPLOY_DOMAIN {
    encode gzip
    reverse_proxy 127.0.0.1:$DEPLOY_APP_PORT
}
EOF

run_ssh "$TARGET" "mv '$ENV_TEMP' '$DEPLOY_PATH/app/.env.production' && chmod 600 '$DEPLOY_PATH/app/.env.production'"
run_sudo "install -m 644 '$SERVICE_TEMP' '/etc/systemd/system/$DEPLOY_SERVICE_NAME.service'"
run_sudo "mkdir -p '$(dirname "$DEPLOY_CADDY_SITE_PATH")'"
run_sudo "install -m 644 '$CADDY_TEMP' '$DEPLOY_CADDY_SITE_PATH'"
if ! run_ssh "$TARGET" "grep -Fq 'import /etc/caddy/conf.d/*.caddy' '$DEPLOY_CADDY_CONFIG_PATH'"; then
  run_sudo "sh -c \"printf '\\nimport /etc/caddy/conf.d/*.caddy\\n' >> '$DEPLOY_CADDY_CONFIG_PATH'\""
fi
run_sudo "rm -f '$SERVICE_TEMP' '$CADDY_TEMP'"
run_sudo "systemctl daemon-reload"
run_sudo "systemctl enable --now '$DEPLOY_SERVICE_NAME'"
run_sudo "systemctl restart '$DEPLOY_SERVICE_NAME'"
run_sudo "caddy validate --config '$DEPLOY_CADDY_CONFIG_PATH'"
run_sudo "systemctl reload caddy"

if [[ -n "${DEPLOY_HEALTHCHECK_URL:-}" ]]; then
  curl --fail --silent --show-error --location --max-time 20 "$DEPLOY_HEALTHCHECK_URL" >/dev/null
fi
rm -rf .deploy
printf 'Deploy complete: https://%s\n' "$DEPLOY_DOMAIN"
