# Gray Areas

## Live site (if GitHub works on your network)

**https://grayziace.github.io/Gray-Areas/**

If you see `ERR_CONNECTION_RESET` or “can’t be reached”, **GitHub Pages is blocked on your network** (common in mainland China). Use Cloudflare Pages below instead.

**Do not use** `grayareas.com` (not owned) or `github.com/grayziace/Gray-Areas` (repo page, not the site).

## China / connection reset fix (Cloudflare Pages, ~5 min, free)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (free)
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → choose **Gray-Areas**
3. Build settings: **Framework preset** = None, **Build command** = leave empty, **Build output directory** = `/`
4. **Save and deploy** → you get a URL like `https://gray-areas.pages.dev`
5. Share that URL with friends and family

Optional: **Custom domains** in Cloudflare Pages after you buy a domain.

### Saving edits permanently (auto-sync)

On your **Cloudflare Pages** URL, edits in **editing mode** auto-save to GitHub after a few seconds. The sidebar shows **Saving to git…** then **Saved to git**. Cloudflare redeploys and everyone sees your changes — no export or push needed.

**One-time setup** (Cloudflare dashboard → your Pages project → **Settings** → **Environment variables**):

| Variable | Value |
|----------|--------|
| `GITHUB_TOKEN` | GitHub Personal Access Token with **Contents: Read and write** on this repo ([create one](https://github.com/settings/tokens?type=beta)) |
| `GITHUB_REPO` | `grayziace/Gray-Areas` (optional — this is the default) |

Add both for **Production** (and Preview if you use preview deploys). Redeploy once after adding them.

### Instant email / text when coders do anything

Add these **optional** env vars on Cloudflare Pages (Settings → Environment variables). Without them, Coder signals in the app still work — you just won't get email/SMS.

| Variable | Value |
|----------|--------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free tier works) |
| `GRAY_NOTIFY_EMAIL` | Your email address |
| `RESEND_FROM` | Verified sender, e.g. `Gray Areas <notify@yourdomain.com>` (optional — defaults to Resend onboarding address) |
| `GRAY_NOTIFY_PHONE` | Your mobile number, e.g. `+44…` (optional, for SMS) |
| `TWILIO_ACCOUNT_SID` | From Twilio (optional, for SMS) |
| `TWILIO_AUTH_TOKEN` | From Twilio (optional, for SMS) |
| `TWILIO_FROM_NUMBER` | Twilio sender number (optional, for SMS) |

You'll get notified when coders create cards, send quests, post on Community, request XP, send private inbox messages, and more.

**Private inbox:** Coders and Gray have an **Inbox** tab — direct messages that pop up on next login. Gray can message specific coders; coders can message Gray or each other.

Auto-sync only runs on the Cloudflare URL (not `file://` or GitHub Pages). **Export to code** in the sidebar is still there as a manual fallback.

**What gets saved:**

- `content.js` — player cards, places, photos, articles, skills, dramas
- `site-state.js` — daily log, pinboard, skill hours, drama episode ratings

## For visitors

Browse everything. Leave a message via **Pinboard**.

## For Gray (updating content)

**Permanent content** — edit `content.js` (cards, photos, articles, dramas).

**Day-to-day logging** — admin mode via `?key=YOUR_KEY` (set in `content.js`) or the subtle **·** button in the sidebar.

### Skill levels

Hours accumulate from daily logs (Mandarin study, hobby hours) plus manual adjustments in admin. Ten tiers:

| Level | Name | Hours |
|-------|------|-------|
| 1 | Novice | 1 |
| 2 | Apprentice | 10 |
| 3 | Competent | 50 |
| 4 | Adept | 100 |
| 5 | Specialist | 250 |
| 6 | Expert | 500 |
| 7 | Artisan | 1,000 |
| 8 | Elite | 2,500 |
| 9 | Paragon | 5,000 |
| 10 | Grandmaster | 10,000 |

### Daily log tracks

Mood, steps, work hours, Mandarin study hours, hobby + hobby hours, new places, new people, a short note.

### CDrama Archive

Standalone section with episode progress, ratings, and status. In admin mode: +/− episode buttons on each card.
