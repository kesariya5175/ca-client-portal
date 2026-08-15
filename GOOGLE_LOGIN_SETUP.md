# Google Sign-In for Clients — Setup

Optional convenience for end clients. A CA firm puts the client's Google
address on the client record; that client can then press **Continue with
Google** instead of remembering a portal password. Clients without an
address on file sign in exactly as before. Firm admins and staff are
unaffected.

---

## 1. Google Cloud Console

Google reorganised this area into the **Google Auth Platform**. The steps
below follow the current UI; older tutorials describing a single "OAuth
consent screen" wizard are out of date. Everything lives in the left
sidebar at <https://console.cloud.google.com/auth/overview>.

1. Create or select a project (`CA Client Portal`).

2. **Branding** — the consent screen your clients see.
   - App name, support email, developer contact.
   - Saving this is what produces "OAuth configuration created".

3. **Data access** — scopes.
   - **Add or remove scopes** → tick exactly these three:
     `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
   - All three are non-sensitive, so they trigger no verification review.
     Add nothing else — sensitive scopes would put the app into a review
     queue for no benefit.

4. **Audience** — who may sign in.
   - Starts as **Testing**: only Gmail addresses listed under *Test users*
     can sign in (max 100). Add your own address here while testing.
   - **Publish app** when ready for real clients. Instant, no review,
     given the scopes above.

5. **Clients → Create OAuth client**
   - Application type: **Web application**
   - **Authorised JavaScript origins**
     ```
     https://YOUR-PORTAL-DOMAIN
     http://localhost:5173
     ```
   - **Authorised redirect URIs** — this is the Supabase callback, *not*
     your own domain, and must match character for character with no
     trailing slash:
     ```
     https://gigqhlfkikufnuxcbwky.supabase.co/auth/v1/callback
     ```

6. Copy the **Client ID** and **Client secret** from the popup.

## 2. Supabase

1. Dashboard → **Authentication → Providers → Google** → enable.
2. Paste the Client ID and Client secret. Save.
3. **Authentication → URL Configuration**
   - Site URL: `https://YOUR-PORTAL-DOMAIN`
   - Redirect URLs: add `http://localhost:5173` for local development.

## 3. Database

Run `GOOGLE_LOGIN_MIGRATION.sql` in the SQL Editor. Safe to re-run.

## 4. Edge function

```bash
supabase functions deploy claim-google
```

No new secrets — it uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`,
which Supabase injects automatically.

---

## How a CA firm enables it for a client

Clients tab → edit the client → **Google Sign-In Address** → enter the
address → Save. That is the whole flow.

The address must be the one on the client's actual Google account. A
Google Workspace address (`name@theirfirm.com`) works just as well as
`@gmail.com`.

## What happens on first sign-in

1. Client presses **Continue with Google**, picks their account.
2. Google returns them to the portal with a verified session.
3. The app calls `claim-google`, which looks for an **active** client
   whose `portal_google_email` matches the verified address.
4. Match → a `users` row with `role='client'` is created and linked;
   they land in their portal.
   No match → they are signed straight back out with *"This Google
   account is not registered with any CA firm on the portal."*

Later sign-ins skip steps 3–4; the link already exists.

## Removing access

Clear the **Google Sign-In Address** field. That stops any *future*
first-time link. If the client has already signed in once, the `users`
row still exists — delete it from the Super Admin panel to fully revoke.

---

## Security notes

- **Enrolment is the gate.** Having a Google account grants nothing. The
  address has to already be on a client record, entered by the firm.
- **The email is read from the verified JWT**, never from the request
  body, so a caller cannot claim to be someone else.
- **Unverified Google emails are rejected**, which blocks the
  impersonation trick of creating an account on an address you do not own.
- **`claim-google` only ever writes `role='client'`.** No input path can
  produce an admin, staff, or super admin row.
- **One Google address, one client** — enforced by a unique index, and
  re-checked in the function against stale `users` rows.
- Inactive clients are refused.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `redirect_uri_mismatch` | The redirect URI in Google Cloud is not exactly the Supabase callback URL |
| Signed out immediately with "not registered" | No active client has that address in `portal_google_email` — check for typos and trailing spaces |
| "already registered to another client" on save | The unique index caught a duplicate; find the other client holding that address |
| Works locally, fails in production | `localhost` origin present but the production domain missing from Google origins / Supabase redirect URLs |
| `access_denied` for a client, works for you | App still in **Testing** under Audience — publish it, or add them as a test user |
| "This client already has a portal login" | See below |

### Clients who already have a username + password

Two auth identities cannot be merged, so a client with an existing portal
login is refused Google sign-in rather than being given a second profile
row. To move such a client over to Google:

1. Super Admin panel → find their user row → **Delete**.
2. Make sure the **Google Sign-In Address** is set on the client record.
3. The client presses **Continue with Google**; a fresh linked row is created.

Their documents, tasks and invoices are attached to the *client* record,
not the user row, so nothing is lost.

New clients who have never been given a password are unaffected — Google
works for them straight away.
