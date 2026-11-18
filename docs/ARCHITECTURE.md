# Architecture

BagsPay is a small Node server with no dependencies and a static dashboard.

- `server.mjs` serves `public/` and a JSON API under `/api`.
- `src/bags.mjs` is the only module that talks to the Bags public API. It sends the `x-api-key` header from `BAGS_API_KEY`.
- The dashboard never sees the API key. It calls the BagsPay API, which returns plain data or unsigned transactions.
- Claims: the server asks the Bags API for claim transactions for `(wallet, tokenMint)` and returns them as base64. The browser wallet signs and sends each one.
- Tests run with `BAGSPAY_MOCK=1`, which answers every API call from sample data, so CI needs no key or network.
