// Attaches the starter photos in prisma/seed/catalogue-photos to the starter catalogue products.
//
// Runs once per database: after a successful run it leaves a marker in the Setting table, so photos
// that staff later replace or delete in the back office are never put back. It only touches products
// that exist and have no photo yet. It never fails the build: on any problem it logs and exits 0,
// and simply tries again on the next deploy.
//
//   node scripts/seed-catalogue-photos.mjs           run if it has not run on this database
//   node scripts/seed-catalogue-photos.mjs --force   run again (still skips products that have photos)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DIR = fileURLToPath(new URL("../prisma/seed/catalogue-photos/", import.meta.url));
const MARKER = "catalogueStarterPhotos";
const force = process.argv.includes("--force");
const log = (msg) => console.log(`[catalogue photos] ${msg}`);

async function main() {
  try {
    (await import("dotenv")).config({ quiet: true }); // local runs read .env; on Vercel the variables are already set
  } catch {
    // dotenv is a dev dependency: fine when it is not installed
  }
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) return log("no database configured, skipping");

  const manifest = JSON.parse(await readFile(`${DIR}photos.json`, "utf8"));
  const db = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
  await db.connect();
  try {
    const done = await db.query('SELECT 1 FROM "Setting" WHERE "key" = $1', [MARKER]);
    if (done.rowCount && !force) return log("already loaded on this database, skipping");

    let added = 0;
    for (const p of manifest.photos) {
      const product = await db.query(
        'SELECT p."id", (SELECT count(*)::int FROM "CatalogImage" i WHERE i."productId" = p."id") AS photos FROM "CatalogProduct" p WHERE p."slug" = $1',
        [p.product],
      );
      const row = product.rows[0];
      if (!row || row.photos > 0) continue; // removed or renamed by staff, or it already has photos

      const [full, thumb] = await Promise.all([readFile(`${DIR}${p.file}`), readFile(`${DIR}${p.thumb}`)]);
      const id = `starter_${p.product.replace(/[^a-z0-9]/g, "")}`.slice(0, 36);
      await db.query("BEGIN");
      try {
        const inserted = await db.query(
          'INSERT INTO "CatalogImage" ("id","productId","position","alt","credit","creditUrl","mime","width","height","bytes") VALUES ($1,$2,0,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT ("id") DO NOTHING',
          [id, row.id, p.alt, p.credit ?? null, p.creditUrl ?? null, p.mime, p.width, p.height, full.byteLength],
        );
        if (inserted.rowCount) {
          await db.query('INSERT INTO "CatalogImageBlob" ("imageId","full","thumb") VALUES ($1,$2,$3)', [id, full, thumb]);
          added++;
        }
        await db.query("COMMIT");
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      }
    }

    await db.query(
      'INSERT INTO "Setting" ("key","value") VALUES ($1,$2::jsonb) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"',
      [MARKER, JSON.stringify({ version: manifest.version, loadedAt: new Date().toISOString(), added })],
    );
    log(`added ${added} photo${added === 1 ? "" : "s"}`);
  } finally {
    await db.end();
  }
}

// whatever happens, never hold up or fail a deploy
setTimeout(() => {
  log("taking too long, skipping (will retry on the next run)");
  process.exit(0);
}, 90_000).unref();

main().catch((e) => {
  log(`skipped after an error (will retry on the next run): ${e?.message ?? e}`);
});
