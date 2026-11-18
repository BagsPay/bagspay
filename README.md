<p align="center"><img src="public/logo.svg" width="88" alt="BagsPay"></p>

<h1 align="center">BagsPay</h1>

<p align="center"><b>Creator fees, in one place.</b><br>
A dashboard for creators who launch tokens on Bags (Solana): see what every token has earned, what is ready to claim, and claim it from your own wallet.</p>

---

## What it does

| Feature | Details |
|---|---|
| Lifetime fees | Total fees each token has generated for its creators, in SOL. |
| Claimable now | Every position with fees ready to claim for a wallet, per token. |
| One-click claim | BagsPay prepares the claim transactions; your wallet (Phantom, Solflare, Backpack) signs and sends them. |
| Token lookup | Paste any token mint to see its creators, fee share and lifetime fees. |
| Non-custodial | BagsPay never holds a key. The server only reads data and builds unsigned transactions. |

## How it works

```
Browser (dashboard) ──► BagsPay server ──► Bags API (fees, positions, claim transactions)
        ▲                     │
        └── wallet signs ◄────┘  unsigned transactions (base64)
```

1. Connect a wallet or paste a wallet address.
2. BagsPay reads lifetime fees and claimable positions from the Bags API.
3. Press **Claim**: the server asks the Bags API for the claim transactions, the wallet signs and sends them.

## Quick start

Requires Node 20 or newer and a Bags API key.

```bash
npm install
```

```bash
cp .env.example .env
```

Put your `BAGS_API_KEY` in `.env`, then:

```bash
npm start
```

Open http://127.0.0.1:8787.

Run the tests (offline, no key needed):

```bash
npm test
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `BAGS_API_KEY` | yes | API key for the Bags public API. |
| `BAGS_API_URL` | no | Defaults to `https://public-api-v2.bags.fm/api/v1`. |
| `SOLANA_RPC` | no | Reserved for your own Solana RPC (Helius, Triton…). |
| `PORT` | no | Defaults to `8787`. |

Keys live only in environment variables on your host (Vercel, Railway…). They are never sent to the browser and never committed: `.env` is ignored by git.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server status. |
| GET | `/api/token/:mint` | Creators and lifetime fees of a token. |
| GET | `/api/wallet/:address/claimable` | Claimable positions for a wallet. |
| POST | `/api/wallet/:address/claim` | Unsigned claim transactions for a token: body `{ "tokenMint": "…" }`. |

## Project structure

```
bagspay/
├── server.mjs          HTTP server and API routes
├── src/bags.mjs        Bags API client
├── src/format.mjs      Lamports, SOL and USD formatting
├── public/             Dashboard (HTML, CSS, JS) and logo
├── test/               Tests (offline, mocked API)
└── docs/               Architecture and deployment notes
```

## Deploy

- **Vercel / Railway / Render:** start command `npm start`, set `BAGS_API_KEY` in the host's environment variables.
- See [docs/DEPLOY.md](docs/DEPLOY.md).

## Contributing

Pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md). Please do not open a public issue.

## License

[MIT](LICENSE)
