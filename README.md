# Dog Decoder (PWA)

Upload a dog photo → get breed guess, characteristics, grooming, exercise needs,
lifespan, and training tips. Installable as an app on phone/desktop home screens,
no app store required. Includes an upsell button for a paid personalized guide.

## What's in this project
- `public/` — the frontend, including the PWA pieces:
  - `manifest.json` — tells the browser this is installable (name, icons, colors)
  - `service-worker.js` — caches the app shell so it opens instantly and has
    basic offline resilience (photo analysis itself always needs network)
  - `icon-*.png`, `favicon.png`, `apple-touch-icon.png` — pre-generated app icons
- `api/analyze.js` — serverless function that calls Claude's vision API. This is
  what keeps your API key private; the browser never sees it.

## Deploy for free (about 15 minutes)

### 1. Get an Anthropic API key
- console.anthropic.com → Settings → API Keys → Create Key
- New accounts get free trial credit.

### 2. Put this project on GitHub
- New repo on github.com (free) → upload this whole folder's contents

### 3. Deploy to Vercel (free tier)
- vercel.com → sign up with GitHub → "Add New" → "Project" → import your repo
- Add an environment variable before deploying:
  - Name: `ANTHROPIC_API_KEY`
  - Value: your key from step 1
- Click Deploy. You get a live HTTPS URL — PWAs require HTTPS, which Vercel
  gives you automatically.

### 4. (Optional) Custom domain
~$10-12/year via Namecheap or Porkbun, pointed at Vercel in Project Settings →
Domains. Not required to launch.

## How people "download" it (no app store, no cost)
Once deployed, anyone who visits the URL can install it as a real app icon:

- **Android (Chrome)**: a banner or the "Install Dog Decoder" button in the app
  itself prompts automatically. Tap it → icon appears on their home screen,
  opens full-screen like any app.
- **iPhone (Safari)**: Safari doesn't support the auto-prompt. Tell users:
  Share icon → "Add to Home Screen." Takes 5 seconds, same result — full-screen
  app icon, no browser chrome.
- **Desktop (Chrome/Edge)**: install icon appears in the address bar, or the
  in-app button works the same way as Android.

Worth putting a one-line "add to home screen" tip in your launch posts, since
the iPhone path isn't automatic.

## Set up the paid upsell (still free to set up)
- Free Stripe account at stripe.com → Payment Links → create one for
  "Personalized Dog Guide — $4.99" (Stripe takes ~2.9% + 30¢ per sale, no
  upfront cost)
- In `public/app.js`, replace `REPLACE_WITH_YOUR_LINK` with your real link
- Redeploy (push to GitHub, Vercel auto-deploys)

Note: the upsell button currently opens a generic Stripe checkout, not a
personalized PDF built from that specific dog's data — that's a next build
step once you've validated people will pay.

## Already set for cost control
`api/analyze.js` is set to `claude-haiku-4-5-20251001` — the cheaper, faster
model, good enough for this use case and friendlier to free-trial credit while
you're unvalidated. Swap to `claude-sonnet-5` later if you want more nuanced
reasoning on tricky mixed breeds.

## Reasonable next builds, in order of priority
1. **Rate limiting** — cap analyses per IP/session so one visitor can't burn
   through your API budget.
2. **Personalized PDF generation** — after a Stripe payment succeeds (via a
   Stripe webhook), generate and email a real PDF guide from that dog's actual
   analysis data.
3. **Image compression** before upload, so large phone photos don't slow
   things down or inflate API costs.
4. **Push notifications** — now that it's a PWA, you could notify users about
   new features or remind them to check in (requires extra setup, optional).

## Local testing
Install the Vercel CLI (`npm i -g vercel`), run `vercel dev` in this folder.
Note: service workers and install prompts only fully work over HTTPS or on
`localhost` — both are fine for testing.

## Updating the app later
Any time you push changes to GitHub, Vercel auto-redeploys. Installed users
get the update automatically next time they open the app (the service worker
checks for a new version in the background).
