// Nightly R2 → R2 document backup
//
// Why this exists:
//   R2's eleven-nines durability protects against disks dying. It does
//   not protect against a delete — ours, a client's, or an attacker's.
//   R2 replicates a deletion just as reliably as it replicates the file.
//   This worker keeps a second copy in a separate bucket so a deletion
//   in the live bucket is recoverable.
//
// The backup bucket should be bound with a token that this worker can
// write to but the main application cannot touch at all. If the app's
// credentials leak, the copy survives.
//
// Deliberately append-only: objects are copied in, never deleted. A
// file removed from the live bucket stays in the backup until an R2
// lifecycle rule expires it (see BACKUP_SETUP.md). That retention
// window is your recovery window.

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBackup(env));
  },

  // Manual trigger, so you can run a backup on demand and see the
  // result. Guarded by a shared secret — without it, anyone who
  // learns the worker URL could hammer your class-A operations.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/run') {
      return new Response('Not found', { status: 404 });
    }
    const auth = request.headers.get('Authorization');
    if (!env.BACKUP_TRIGGER_SECRET || auth !== `Bearer ${env.BACKUP_TRIGGER_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    const result = await runBackup(env);
    return Response.json(result);
  },
};

async function runBackup(env) {
  const started = Date.now();
  let copied = 0, skipped = 0, failed = 0, scanned = 0;

  let cursor = undefined;

  try {
    do {
      // R2 list() caps at 1000 per page. Large accounts page through.
      const listing = await env.LIVE_BUCKET.list({
        limit: 1000,
        cursor,
        include: ['httpMetadata', 'customMetadata'],
      });

      for (const obj of listing.objects) {
        scanned++;
        try {
          // Incremental: only copy what changed. head() is a class-B
          // operation (cheap); a needless copy is class-A (10x pricier)
          // plus the read. On a steady-state bucket almost everything
          // is skipped, so a nightly run costs close to nothing.
          const existing = await env.BACKUP_BUCKET.head(obj.key);

          if (existing && existing.etag === obj.etag) {
            skipped++;
            continue;
          }

          const source = await env.LIVE_BUCKET.get(obj.key);
          if (!source) {
            // Deleted between list and get. Not an error — the next
            // run will settle it.
            skipped++;
            continue;
          }

          await env.BACKUP_BUCKET.put(obj.key, source.body, {
            httpMetadata: source.httpMetadata,
            customMetadata: {
              ...(source.customMetadata ?? {}),
              backedUpAt: new Date().toISOString(),
              sourceEtag: obj.etag,
            },
          });
          copied++;
        } catch (err) {
          failed++;
          console.error(`Failed to back up ${obj.key}: ${err.message}`);
        }
      }

      cursor = listing.truncated ? listing.cursor : undefined;
    } while (cursor);

    const result = {
      ok: failed === 0,
      scanned, copied, skipped, failed,
      seconds: Math.round((Date.now() - started) / 1000),
      finishedAt: new Date().toISOString(),
    };

    // Surfaces in `wrangler tail` and the Workers dashboard logs.
    // A run reporting failures needs looking at the same day — a
    // backup you believe in but which is silently broken is worse
    // than knowing you have none.
    if (failed > 0) {
      console.error('R2 backup completed WITH FAILURES', JSON.stringify(result));
    } else {
      console.log('R2 backup complete', JSON.stringify(result));
    }

    return result;
  } catch (err) {
    console.error('R2 backup ABORTED', err.stack || err.message);
    return { ok: false, error: err.message, scanned, copied, skipped, failed };
  }
}
