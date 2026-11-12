const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { Client, types } = require('pg');
types.setTypeParser(20, (value) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw Error('Database integer exceeds safe range.');
  return parsed;
});
require('@next/env').loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

function schemaName() {
  const schema = process.env.DATABASE_SCHEMA || 'public';
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw Error('Invalid DATABASE_SCHEMA.');
  return schema;
}
async function connect() {
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is required.');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
  client.on('error', (error) =>
    console.error(
      'PostgreSQL administrative connection failed:',
      error.code || 'connection closed',
    ),
  );
  try {
    await client.connect();
  } catch (error) {
    try {
      await client.end();
    } catch (closeError) {
      console.error(
        'PostgreSQL failed connection cleanup:',
        closeError.code || 'connection closed',
      );
    }
    throw error;
  }
  return client;
}
async function rollback(client) {
  try {
    await client.query('ROLLBACK');
  } catch (error) {
    console.error(
      'PostgreSQL rollback failed:',
      error.code || error.message?.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]'),
    );
  }
}
async function migrate(client) {
  await client.query('BEGIN');
  try {
    await client.query(`SET LOCAL search_path TO "${schemaName()}"`);
    await client.query('SELECT pg_advisory_xact_lock(817462901)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS app_schema_migrations(version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    for (const file of fs
      .readdirSync(path.join(__dirname, '../migrations'))
      .filter((f) => /^\d+.*\.sql$/.test(f))
      .sort()) {
      const sql = fs
        .readFileSync(path.join(__dirname, '../migrations', file), 'utf8')
        .replace(/\r\n/g, '\n');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = (
        await client.query('SELECT checksum FROM app_schema_migrations WHERE version=$1', [file])
      ).rows[0];
      if (existing) {
        if (existing.checksum !== checksum)
          throw Error('Applied migration checksum mismatch: ' + file);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO app_schema_migrations(version,checksum) VALUES($1,$2)', [
        file,
        checksum,
      ]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await rollback(client);
    throw error;
  }
}
// Avoid logging database error detail, row contents, or connection credentials.
function report(error) {
  console.error(
    'Database operation failed:',
    error.code || error.message?.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]'),
  );
  process.exitCode = 1;
}
module.exports = { connect, migrate, rollback, schemaName, report };
