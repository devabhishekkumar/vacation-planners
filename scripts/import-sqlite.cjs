// SQLite is used only by this offline migration tool, never by the application.
const { DatabaseSync, backup } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { connect, migrate, rollback, schemaName, report } = require('./postgres-tools.cjs');
const tables = [
  'users',
  'sessions',
  'attempts',
  'enquiries',
  'activity',
  'customer_profiles',
  'admin_leads',
  'travel_bookings',
  'booking_payments',
  'website_booking_requests',
  'website_content',
  'website_reviews',
  'travel_feature_migrations',
  'trip_plans',
  'trip_services',
  'trip_documents',
  'trip_notifications',
];
const keys = {
  sessions: 'token',
  attempts: 'email',
  customer_profiles: 'user_id',
  website_booking_requests: 'request_key',
  travel_feature_migrations: 'version',
  trip_plans: 'booking_id',
};
const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
function canonical(row, columns) {
  return JSON.stringify(
    columns.map((column) => {
      const value = row[column];
      return value instanceof Uint8Array
        ? { hex: Buffer.from(value).toString('hex') }
        : typeof value === 'bigint'
          ? Number(value)
          : value;
    }),
  );
}
async function importSqlite(sourcePath, verifyOnly = false, options = {}) {
  const source = path.resolve(sourcePath);
  if (!fs.existsSync(source)) throw Error('SQLite source does not exist.');
  const backupDirectory = path.resolve(process.cwd(), '.data', 'migration-backups');
  fs.mkdirSync(backupDirectory, { recursive: true });
  const backupPath = path.join(backupDirectory, `accounts-${Date.now()}-${randomUUID()}.sqlite`);
  const live = new DatabaseSync(source, { readOnly: true });
  try {
    await backup(live, backupPath);
  } finally {
    live.close();
  }
  const sqlite = new DatabaseSync(backupPath, { readOnly: true });
  let client;
  try {
    if (sqlite.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok')
      throw Error('SQLite integrity check failed.');
    if (sqlite.prepare('PRAGMA foreign_key_check').all().length)
      throw Error('SQLite contains foreign key violations.');
    const present = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => row.name);
    const unknown = present.filter((name) => !tables.includes(name));
    if (unknown.length) throw Error('Unmapped SQLite tables: ' + unknown.join(', '));
    client = await connect();
    await migrate(client);
    await client.query('BEGIN');
    try {
      await client.query(`SET LOCAL search_path TO "${schemaName()}"`);
      await client.query('SELECT pg_advisory_xact_lock(817462901)');
      // Prevent concurrent writes, including queries outside app transactions.
      await client.query('LOCK TABLE ' + tables.map(quote).join(',') + ' IN EXCLUSIVE MODE');
      const results = [];
      for (const table of tables.filter((t) => present.includes(t))) {
        const columns = sqlite
          .prepare(`PRAGMA table_info(${quote(table)})`)
          .all()
          .map((row) => row.name);
        const targetColumns = (
          await client.query(
            'SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1',
            [table],
          )
        ).rows.map((row) => row.column_name);
        if (columns.some((column) => !targetColumns.includes(column)))
          throw Error('Unmapped SQLite columns in ' + table);
        const key = keys[table] || 'id';
        const rows = sqlite
          .prepare(`SELECT rowid AS __source_order,* FROM ${quote(table)} ORDER BY rowid`)
          .all();
        let inserted = 0;
        const digest = createHash('sha256');
        for (const row of rows) {
          let target = (
            await client.query(
              `SELECT ${columns.map(quote).join(',')} FROM ${quote(table)} WHERE ${quote(key)}=$1`,
              [row[key]],
            )
          ).rows[0];
          if (!target && !verifyOnly) {
            const names = [...columns, 'insertion_order'];
            await client.query(
              `INSERT INTO ${quote(table)}(${names.map(quote).join(',')}) VALUES(${names.map((_, i) => '$' + (i + 1)).join(',')})`,
              [
                ...columns.map((column) =>
                  row[column] instanceof Uint8Array ? Buffer.from(row[column]) : row[column],
                ),
                row.__source_order,
              ],
            );
            inserted++;
            target = (
              await client.query(
                `SELECT ${columns.map(quote).join(',')} FROM ${quote(table)} WHERE ${quote(key)}=$1`,
                [row[key]],
              )
            ).rows[0];
          }
          if (!target || canonical(row, columns) !== canonical(target, columns))
            throw Error(
              'Missing or conflicting PostgreSQL record in ' + table + '; import rolled back.',
            );
          digest.update(canonical(target, columns));
        }
        // Advance the sequence past explicitly imported insertion-order values.
        if (!verifyOnly)
          await client.query(
            `SELECT setval(pg_get_serial_sequence($1,'insertion_order'), COALESCE((SELECT max(insertion_order) FROM ${quote(table)}),0)+1, false)`,
            [table],
          );
        results.push({
          table,
          sourceRows: rows.length,
          inserted,
          verified: rows.length,
          sha256: digest.digest('hex'),
        });
      }
      await client.query('COMMIT');
      const result = {
        backupPath,
        mode: verifyOnly ? 'verify' : 'import',
        verifiedAt: new Date().toISOString(),
        tables: results,
      };
      fs.writeFileSync(backupPath + '.verification.json', JSON.stringify(result, null, 2));
      if (!options.quiet) console.log(JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      await rollback(client);
      throw error;
    }
  } finally {
    sqlite.close();
    await client?.end();
  }
}
module.exports = { importSqlite };
if (require.main === module) {
  const args = process.argv.slice(2),
    source = args.find((arg) => !arg.startsWith('--'));
  if (!source) {
    console.error('Usage: node scripts/import-sqlite.cjs <SQLite path> [--verify-only]');
    process.exitCode = 1;
  } else importSqlite(source, args.includes('--verify-only')).catch(report);
}
