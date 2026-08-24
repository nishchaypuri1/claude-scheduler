\# Claude Scheduler



Schedule a message to be sent automatically to an AI API (Claude or Groq) at a specific date and time — even if your laptop or phone is turned off, as long as the server is deployed and running.



\## Features



\- 🕒 Set a date/time and a message from a simple web UI

\- ⚙️ Backend checks every minute (via `node-cron`) and auto-sends due messages

\- 💾 Schedules and responses are stored in `schedules.json`

\- ❌ Cancel a pending schedule before it fires

\- 🌐 Works independent of your device once deployed to the cloud



\## Tech Stack



\- Node.js + Express

\- node-cron (scheduling engine)

\- Vanilla HTML/CSS/JS frontend

\- Groq API / Anthropic Claude API



\## Setup



1\. Clone the repo:

```bash

&#x20;  git clone https://github.com/nishchaypuri1/claude-scheduler.git

&#x20;  cd claude-scheduler

```



2\. Install dependencies:

```bash

&#x20;  npm install

```



3\. Copy the env example and add your API key:

```bash

&#x20;  cp .env.example .env

```

&#x20;  Then open `.env` and fill in:



\## Getting an API Key



\- \*\*Groq (free):\*\* https://console.groq.com → API Keys → Create API Key

\- \*\*Anthropic Claude:\*\* https://console.anthropic.com → Settings → API Keys → Create Key (requires billing)



\## Deployment (so it runs 24/7, independent of your device)



Deploy to \[Render](https://render.com) or \[Railway](https://railway.app):



1\. Push this repo to GitHub

2\. Create a new Web Service on Render/Railway and connect your GitHub repo

3\. Add your API key as an environment variable (`GROQ\_API\_KEY`)

4\. Deploy — your scheduler now runs in the cloud, fully independent of your laptop/phone



\## How It Works



The backend runs a cron job every minute that checks `schedules.json` for any schedule whose time has arrived. When it finds one, it calls the AI API with the stored prompt, then saves the reply back into `schedules.json`, which the frontend polls and displays.



\## License



MIT

