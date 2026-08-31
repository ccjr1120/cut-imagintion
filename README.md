# cut-imagintion

Gu Mengxue's video editor portfolio, built with React, TypeScript, and Vite.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The production files are generated in `dist/`.

## Deployment with Caddy

The deploy script builds the site locally and uploads `dist/` to the server. Copy the environment template, fill in the SSH details, then run:

```bash
cp .env.deploy.example .env.deploy
npm run deploy
```

The deploy script automatically installs Caddy on Debian/Ubuntu when it is missing, adds the site block when `DEPLOY_DOMAIN` is not already configured, validates it, and reloads the service. Keep `DEPLOY_DOMAIN`, `DEPLOY_PATH`, and `DEPLOY_CADDY_CONFIG_PATH` aligned with the server. To configure Caddy manually, copy [Caddyfile.example](Caddyfile.example) to `/etc/caddy/Caddyfile`:

```bash
sudo apt install -y caddy
sudo cp Caddyfile.example /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

Point the domain's DNS record to the server and allow ports `80` and `443`. Caddy will then obtain and renew HTTPS certificates automatically.
