# Publishing MediBot AI to Vercel

MediBot AI is fully configured for seamless 1-click or CLI deployment on **Vercel**.

## Features Configured for Vercel
- **Frontend SPA**: Vite + React 19 built to `/dist`
- **Backend API**: Serverless Functions automatically hosted via `/api/index.ts`
- **Routing**: `vercel.json` rewrites configured for SPA and API proxying

---

## Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure your repository is pushed to your Git provider.

## Step 2: Import into Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** -> **Import Git Repository**.
3. Select your repository.

## Step 3: Configure Environment Variables
In the Vercel deployment setup screen, add the following environment variable under **Environment Variables**:

| Variable Name | Value | Description |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key (Enables real-time AI & Grounding) |

*Note: If `GEMINI_API_KEY` is omitted, MediBot AI automatically activates its internal Clinical Rule Engine and offline synthesis mode without crashing.*

## Step 4: Deploy!
Click **Deploy**. Vercel will automatically:
1. Run `npm run build` to generate the Vite production bundle.
2. Deploy `/api/index.ts` as a Node.js Serverless Function.
3. Serve your app at `https://<your-app-name>.vercel.app`.

---

## Vercel CLI Deployment (Alternative)
If you prefer deploying via terminal:
```bash
npm install -g vercel
vercel login
vercel --prod
```
When prompted, set `GEMINI_API_KEY` in Environment Variables.
