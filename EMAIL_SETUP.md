# Email Setup Guide

Emails are sent via **Resend** (free tier: 100 emails/day) through a Supabase Edge Function.

## Step 1 — Get Resend API Key
1. Sign up at [resend.com](https://resend.com) (free)
2. Go to API Keys → Create API Key
3. Copy the key -re_AMxsqKh6_2ab1DPdWvujwx6bzav3swDSc

## Step 2 — Deploy Edge Function
In your terminal (from the project folder):
```bash
npx supabase functions deploy send-email --project-ref gigqhlfkikufnuxcbwky
npx supabase secrets set RESEND_API_KEY=re_AMxsqKh6_2ab1DPdWvujwx6bzav3swDSc --project-ref gigqhlfkikufnuxcbwky
```

## Step 3 — Verify your domain in Resend
Or use Resend's free shared domain `onboarding@resend.dev` for testing.
Update `from:` in `supabase/functions/send-email/index.ts` accordingly.

## What triggers emails
- **Document request created** → email sent to client
- **Service status updated** → email sent to client  
- **Task overdue** → can be triggered manually or via a scheduled function

## Testing
After deploying, create a document request for a client who has an email — they'll receive an email automatically.
