### Setup — run this project locally

This README contains only the minimal steps to set up and run the project on a Windows machine (PowerShell). It assumes you have Node.js and npm installed.

Prerequisites
- Node.js (v16+ recommended) and npm

1) Install server dependencies and create .env

Open PowerShell and run:

`powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\server
npm install
# copy the example and edit it (or create a new .env)
copy .env.example .env
notepad .env
# In the .env file set your provider configuration, for example either:
# GEMINI_PROVIDER=google
# GEMINI_API_KEY=YOUR_GOOGLE_API_KEY
# GEMINI_MODEL=gemini-2.5-flash
# OR for a generic provider:
# GEMINI_API_URL=https://your-provider.example/v1/generate
# GEMINI_API_KEY=YOUR_PROVIDER_KEY
# PORT=4000
`

2) Install client dependencies

`powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\client
npm install
`

3) Run server and client (two terminals)

Terminal A — server:

`powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\server
npm run dev
`

Terminal B — client:

`powershell
cd C:\Users\somya\OneDrive\Desktop\chatbot\client
npx vite
# or: npm run dev
`

Open the URL the Vite dev server prints (e.g. http://localhost:5173 or http://localhost:5174) in your browser.

Notes
- Keep server/.env out of version control (add it to .gitignore).
- The backend proxies requests to the LLM provider so API keys stay on the server.
- If you see port conflicts, either stop the process holding the port or start Vite with --port <n>.

That's all — these steps are all you need to run the project locally.
