# Setup

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

Copy `.env.example` to `server/.env` and keep `DATA_MODE=mock` for the first local run.

## 3. Start Development Servers

```bash
npm run dev:server
npm run dev:client
```

## 4. Seed Demo Data

```bash
npm run seed
```

## 5. Open the Dashboard

Visit `http://localhost:5173`.

## Ports

The local development defaults are:

```txt
API: http://localhost:5050
Client: http://localhost:5173
```

If Vite chooses another client port, the API accepts local Vite origins during development.
