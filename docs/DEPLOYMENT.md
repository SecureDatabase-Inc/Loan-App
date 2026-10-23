# Deployment

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Cloudinary account for identity-document storage (optional; the server can run with storage disabled)
- SMTP service (for emails)

## Steps

1. Clone & install
```bash
git clone <repo>
cd loan-platform
npm install
```

The root `package.json` uses `concurrently`. To install all workspaces at once:
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

2. Start infrastructure
```bash
docker-compose up -d
```

3. Configure environment
```bash
cd server && cp .env.example .env
cd ../client && cp .env.example .env.local
# Edit .env / .env.local with your values
```

4. Run migrations
```bash
cd server
npx prisma migrate deploy
npx prisma db seed
```

5. Build & start
```bash
npm run build
npm start
```

## Identity document storage

Set `KYC_STORAGE_PROVIDER` explicitly in production:

- `cloudinary` requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET`. The server refuses to start if any are missing.
- `disabled` rejects uploads with a clear error and keeps all other features working.

Credentials are server-only; never expose them through `NEXT_PUBLIC_*`
variables or the client bundle. Uploads are limited to 5 MB and
`UPLOAD_LIMIT_MAX` per user per 15 minutes.

See `docs/security/kyc-storage.md` for the full storage contract.

## Production
- Use a process manager (PM2)
- Set up Nginx reverse proxy
- Enable HTTPS with Let's Encrypt
- Use managed PostgreSQL
- Run `npx prisma migrate deploy` as part of the release step