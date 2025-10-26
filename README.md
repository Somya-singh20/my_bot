# Chatbot (React + Express) - Gemini Free starter

This repository contains a minimal React (Vite) frontend and Express backend that forwards chat requests to a Gemini Free LLM endpoint.

Important: never embed API keys in frontend code. The backend proxies requests to the Gemini endpoint using environment variables.

Files of interest
- `server/` - Express server exposing `POST /api/chat` and forwarding to the Gemini endpoint. Configure with `GEMINI_API_URL` and `GEMINI_API_KEY` in `server/.env`.
- `client/` - Vite + React app. Dev server proxies `/api` to `http://localhost:4000`.


Setup (PowerShell)

1. Server

Open PowerShell and run:

```powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\server
npm install
copy .env.example .env
notepad .env
# edit the .env file and paste your GEMINI_API_URL and GEMINI_API_KEY, then save
```

2. Client

```powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\client
npm install
```

Run (two terminals)

Terminal 1 (server):

```powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\server
npm run dev
```

Terminal 2 (client):

```powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\client
npm run dev
```

Open http://localhost:5173 in your browser.

Where to get Gemini Free credentials

- Gemini Free is a product name that may be offered by Google or other providers. Follow the provider's signup flow to create an API key or set up OAuth credentials for the free tier. The exact endpoint and payload shape vary; consult the provider docs. If the provider exposes an endpoint like `https://.../v1/models/gemini-free:generate`, put that URL in `GEMINI_API_URL` and the key in `GEMINI_API_KEY`.


Gemini Free notes
- Gemini Free may have a REST endpoint that expects a specific JSON payload. The server currently forwards the `messages` array and `max_tokens` in the request body — adjust `server/index.js` payload to match the Gemini Free API docs.
- Typical response shapes vary. The client attempts several common fields when extracting the assistant reply. If responses look different, update `client/src/App.jsx` -> `extractReply`.

Security
- Keep `GEMINI_API_KEY` only in `server/.env` (never commit).
- For production, use a secrets manager (Azure Key Vault, AWS Secrets Manager, etc.) or environment variables in your hosting provider.

Next steps
- Tune request/response mapping in `server/index.js` for the exact Gemini Free API shape.
- Add streaming support if the Gemini endpoint supports chunked streaming (would require server-side streaming proxy and client-side stream handling).
React + Express chatbot starter using Gemini Free (proxy backend)

Overview

This repository contains a minimal full-stack starter for building a chat UI in React (Vite) and a small Express backend that proxies requests to a Gemini Free LLM endpoint. The design keeps the API key on the server and never exposes it to the browser.

Structure

- server/ - Express backend
- client/ - Vite + React frontend

Getting started

1. Install dependencies for server and client

# from repository root (PowerShell)
cd server; npm install; cd ../client; npm install

2. Configure environment variables

Create `server/.env` with:

GEMINI_API_URL=https://your-gemini-free-endpoint.example/v1/generate
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000

3. Run the server and client

# in PowerShell, open two terminals
cd server; npm run dev
cd client; npm run dev

Security notes

- Keep `GEMINI_API_KEY` secret and only on the server.
- Do not check `.env` into source control.

License

MIT
