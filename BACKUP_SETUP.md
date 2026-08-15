# Backups — Setup and Restore

Two jobs, both free to run:

| What | Where it runs | When | Protects against |
|---|---|---|---|
| `pg_dump` of Postgres | GitHub Actions | 01:00 IST daily | dropped tables, bad migrations, Supabase outage |
| R2 → R2 document copy | Cloudflare Worker | 01:30 IST daily | deleted files, leaked app credentials |

Neither is a substitute for the other. The database holds *pointers* to
documents; the documents themselves are files. Restoring one without the
other gives you a portal full of broken links or a pile of orphaned PDFs.

> **Why this exists at all:** the Supabase free plan includes no
> automated backups, and R2's eleven-nines durability protects against
> hardware failure, not against deletion. R2 replicates a `DELETE` as
> faithfully as it replicates the file.

---

## Part 1 — Database backup

### Buckets

Create a backup bucket in the Cloudflare dashboard, separate from the
live one:

```
cacp-backups
```

### R2 API token

Cloudflare dashboard → **R2 → Manage API Tokens → Create token**

- Permission: **Object Read & Write**
- Scope it to `cacp-backups` only — nothing else
- Copy the **Access Key ID**, **Secret Access Key**, and your **Account ID**

### Database connection string

Supabase → **Project Settings → Database → Connection string → URI**.
Use the **session pooler** or direct connection; substitute your real
password for `[YOUR-PASSWORD]`.

### GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `SUPABASE_DB_URL` | `postgresql://postgres:...@db.gigqhlfkikufnuxcbwky.supabase.co:5432/postgres` |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | from the R2 token |
| `R2_SECRET_ACCESS_KEY` | from the R2 token |
| `R2_BACKUP_BUCKET` | `cacp-backups` |

`SUPABASE_DB_URL` contains your database password. It belongs in GitHub
secrets and nowhere else — never in `.env.example`, never committed.

### First run

Repo → **Actions → Backup database → Run workflow**. Don't wait for the
cron to find out whether it works.

A green run puts `database/cacp-YYYY-MM-DD.sql.gz` in `cacp-backups`.
The workflow fails deliberately if the dump comes out under 2 KB or has
no `CREATE TABLE` in it, because a job that "succeeds" while uploading
an empty file is the failure mode that actually bites people.

---

## Part 2 — Document backup

Only relevant once documents are on R2. If they are still in Supabase
Storage, do that migration first — `pg_dump` does **not** capture
storage objects, so those files are currently backed up by nothing.

### Buckets

```
cacp-documents          ← live, the app writes here
cacp-documents-backup   ← copy, only the worker writes here
```

### Deploy

```bash
cd workers/r2-backup
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put BACKUP_TRIGGER_SECRET   # any long random string
```

Adjust `bucket_name` in `wrangler.toml` if your buckets are named
differently.

### Test it

```bash
curl -X POST https://cacp-r2-backup.<your-subdomain>.workers.dev/run \
  -H "Authorization: Bearer <BACKUP_TRIGGER_SECRET>"
```

Returns `{ ok, scanned, copied, skipped, failed, seconds }`. First run
copies everything; later runs skip unchanged objects by comparing etags,
so they are fast and cheap.

Watch live logs with `npx wrangler tail`.

### Retention

The worker never deletes — a file removed from the live bucket stays in
the backup. Set the recovery window with a lifecycle rule on
`cacp-documents-backup`:

Cloudflare dashboard → the bucket → **Settings → Object lifecycle rules**
→ delete objects **90 days** after creation.

90 days is a judgement call. Long enough that a deletion noticed weeks
later is still recoverable; short enough that storage stays trivial.
Indian CA record-retention expectations may argue for longer — worth
checking `LEGAL-COMPLIANCE.md` before settling on a number.

### Token hygiene

The application's R2 token should have **no access** to
`cacp-documents-backup`. If the app is compromised, the attacker reaches
the live bucket and nothing else. Scoping both buckets to one token
throws away most of the value of having two.

---

## Part 3 — The restore drill

**Do this once, now, before you need it.** A backup you have never
restored from is a hypothesis, not a backup. Budget half an hour.

### Restoring the database

1. Create a scratch Supabase project (free tier allows two).
2. Pull the newest dump:
   ```bash
   aws s3 cp s3://cacp-backups/database/cacp-2026-08-15.sql.gz . \
     --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   tar -xzf cacp-2026-08-15.sql.gz
   ```
3. Load it:
   ```bash
   psql "<SCRATCH_DB_URL>" -f schema.sql
   psql "<SCRATCH_DB_URL>" -f data.sql
   ```
4. Check the row counts match production:
   ```sql
   select 'firms' t, count(*) from firms
   union all select 'clients', count(*) from clients
   union all select 'documents', count(*) from documents
   union all select 'invoices', count(*) from invoices;
   ```
5. Confirm RLS policies came across — this is the one people miss, and
   restoring a multi-tenant database without its policies means every
   firm can read every other firm's clients:
   ```sql
   select tablename, policyname from pg_policies order by tablename;
   ```
6. Delete the scratch project.

### Restoring a deleted document

```bash
aws s3 cp "s3://cacp-documents-backup/<firm_id>/<client_id>/<request_id>/<file>" \
          "s3://cacp-documents/<firm_id>/<client_id>/<request_id>/<file>" \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Keys are identical in both buckets, so the path from the `documents`
row's `file_url` is the path in the backup.

### Restoring everything

Database first, then files. The `documents` table is the index — without
it you have a bucket of PDFs and no idea which client each belongs to.

---

## What is still not covered

Worth being clear-eyed about the gaps, rather than assuming the two jobs
above mean "backed up":

- **Up to 24 hours of data loss.** These are nightly snapshots. Recovering
  to a specific moment needs point-in-time recovery, which is a Supabase
  Pro feature. Fine pre-revenue; not fine once firms are filing returns.
- **Supabase Auth users are not in the dump.** `pg_dump` covers the
  `public` schema, not `auth.users`. Losing the project means clients
  re-link their Google accounts and staff need new passwords — the
  `public.users` rows survive, so nobody loses data, but everybody
  re-authenticates.
- **Free projects pause after a week of inactivity.** Not a backup
  problem, but the same upgrade fixes it.
- **Nobody is alerted on failure.** Failures show in the Actions tab and
  `wrangler tail`, which means someone has to look. Worth wiring a
  notification once there is a real client depending on this.

## When to stop relying on this

Move to Supabase Pro when the first firm starts filing real returns. Not
for the storage — for daily automated backups, point-in-time recovery,
and the project no longer pausing. At ₹999/month per firm that is
roughly two to three clients' revenue. Keep these two jobs running
anyway; belt and braces costs nothing.
