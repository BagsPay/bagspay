# Deploying BagsPay

## Railway / Render / any Node host

1. Create a new service from this repository.
2. Start command: `npm start` (the server listens on the platform's `PORT`).
3. Set environment variables: `BAGS_API_KEY` (required), `SOLANA_RPC` (optional).
4. Health check path: `/api/health`.

## Local

```bash
cp .env.example .env
```

```bash
node --env-file=.env server.mjs
```

## Checklist

- `GET /api/health` returns `"keyConfigured": true`.
- Never commit `.env`; keys belong in the host's environment variables.
