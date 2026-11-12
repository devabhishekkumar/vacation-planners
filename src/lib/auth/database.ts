import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, types, type PoolClient, type QueryResult } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
type Row = Record<string, string | number | Buffer | null>;
type TransactionContext = { client: PoolClient; active: boolean; connectionError?: Error };
const transactionClient = new AsyncLocalStorage<TransactionContext>();
let pool: Pool | undefined;
function logConnectionError(phase: string, error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN';
  // Preserve useful transport diagnostics without logging credentials or SQL values.
  console.error('PostgreSQL connection failure', { phase, code });
}
function connection() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) throw Error('Set DATABASE_URL on the server.');
  const schema = process.env.DATABASE_SCHEMA || 'public';
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw Error('Invalid DATABASE_SCHEMA.');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    types: {
      getTypeParser: (oid, format) =>
        oid === 20
          ? (value: string) => {
              const result = Number(value);
              if (!Number.isSafeInteger(result))
                throw Error('Database integer exceeds safe range.');
              return result;
            }
          : types.getTypeParser(oid, format),
    },
  });
  // pg has already removed an idle client before emitting the pool error.
  // Do not release it a second time or replace the whole pool.
  pool.on('error', (error) => logConnectionError('idle', error));
  if (process.env.VERCEL) attachDatabasePool(pool);
  return pool;
}
function assertActive(context: TransactionContext) {
  if (!context.active) throw Error('Database transaction has already completed.');
  if (context.connectionError) throw context.connectionError;
}
async function execute(context: TransactionContext, sql: string, values: unknown[] = []) {
  assertActive(context);
  try {
    return await context.client.query<Row>(sql, values);
  } catch (error) {
    throw context.connectionError || error;
  }
}
async function withTransaction<T>(work: () => Promise<T>, serialize: boolean): Promise<T> {
  const client = await connection().connect();
  const context: TransactionContext = { client, active: true };
  let failed = false;
  // Pool error listeners only cover idle clients. A checked-out client can emit
  // error even between statements, when no query promise is awaiting it.
  const onError = (error: Error) => {
    context.connectionError ||= error;
    logConnectionError('checked-out', error);
  };
  client.on('error', onError);
  try {
    await execute(context, 'BEGIN');
    await execute(context, `SET LOCAL search_path TO "${process.env.DATABASE_SCHEMA || 'public'}"`);
    // Keep the same transaction-scoped lock and isolation as existing writes.
    if (serialize) await execute(context, 'SELECT pg_advisory_xact_lock(817462901)');
    const result = await transactionClient.run(context, work);
    await execute(context, 'COMMIT');
    return result;
  } catch (error) {
    failed = true;
    const original = context.connectionError || error;
    if (!context.connectionError) {
      try {
        await execute(context, 'ROLLBACK');
      } catch (rollbackError) {
        logConnectionError('rollback', rollbackError);
      }
    }
    // A failed rollback must never replace the original failure. In particular,
    // a lost COMMIT acknowledgement is not permission to replay the operation.
    throw original;
  } finally {
    context.active = false;
    // Explicitly evict on failure, including a failed rollback or a disconnect
    // that occurred between awaited statements. Release exactly once.
    client.release(failed || Boolean(context.connectionError));
    client.removeListener('error', onError);
  }
}
async function query(sql: string, values: unknown[]): Promise<QueryResult<Row>> {
  const current = transactionClient.getStore();
  if (current) return execute(current, sql, values);
  if (!process.env.DATABASE_SCHEMA || process.env.DATABASE_SCHEMA === 'public')
    return connection().query<Row>(sql, values);
  return withTransaction(() => query(sql, values), false);
}
const database = {
  async get(sql: string, ...values: unknown[]) {
    return (await query(sql, values)).rows[0] as Row | undefined;
  },
  async all(sql: string, ...values: unknown[]) {
    return (await query(sql, values)).rows;
  },
  async run(sql: string, ...values: unknown[]) {
    return { changes: (await query(sql, values)).rowCount || 0 };
  },
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    const current = transactionClient.getStore();
    if (current) {
      assertActive(current);
      return work();
    }
    return withTransaction(work, true);
  },
  async close() {
    const current = pool;
    pool = undefined;
    await current?.end();
  },
};
export function db() {
  return database;
}
export type Role = 'admin' | 'team' | 'customer';
export type User = { id: string; name: string; email: string; role: Role; active: number };
export type Enquiry = {
  id: string;
  customer_id: string;
  assigned_to: string | null;
  destination: string;
  requirements: string;
  status: string;
  followup: string;
  notes: string;
  created_at: string;
  customer_name: string;
  employee_name: string | null;
};
export async function recordActivity(actorId: string, message: string) {
  await db().run(
    'INSERT INTO activity(id,actor_id,message,created_at) VALUES($1,$2,$3,$4)',
    crypto.randomUUID(),
    actorId,
    message,
    new Date().toISOString(),
  );
}
