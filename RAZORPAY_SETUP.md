# Razorpay Payment Setup Guide

Complete these 4 steps once you have your Razorpay account ready.

## Step 1 — Add Key to Vercel

1. Go to [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Enter:
   - Name: `VITE_RAZORPAY_KEY_ID`
   - Value: your Razorpay live key (starts with `rzp_live_...`)
   - Environment: Production
4. Click **Save**
5. Redeploy the project for the variable to take effect

> Get your Key ID from Razorpay Dashboard → Settings → API Keys

---

## Step 2 — Add Secrets to Supabase

Run these two commands in your terminal (set SUPABASE_ACCESS_TOKEN first if needed):

```bash
set SUPABASE_ACCESS_TOKEN=your-supabase-token
npx supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx RAZORPAY_KEY_SECRET=your_secret_here --project-ref gigqhlfkikufnuxcbwky
```

Replace `rzp_live_xxx` with your Key ID and `your_secret_here` with your Key Secret.

> Get both from Razorpay Dashboard → Settings → API Keys. Never commit these to GitHub.

---

## Step 3 — Deploy the Edge Function

```bash
npx supabase functions deploy razorpay-order --project-ref gigqhlfkikufnuxcbwky
```

This deploys the server-side function that creates Razorpay orders securely.

---

## Step 4 — Run SQL Migration in Supabase

1. Go to [supabase.com/dashboard/project/gigqhlfkikufnuxcbwky/sql](https://supabase.com/dashboard/project/gigqhlfkikufnuxcbwky/sql)
2. Paste and run:

```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
```

This adds columns to store payment confirmation IDs against each invoice.

---

## How it works after setup

- CA creates an invoice in the Billing tab
- Client logs in → goes to **My Bills** → clicks **Pay Now**
- Razorpay checkout opens (supports UPI, cards, net banking, wallets)
- On successful payment, invoice is automatically marked as Paid
- Payment ID is saved against the invoice for reference
