const { connect, migrate, report } = require('./postgres-tools.cjs');
(async () => {
  const client = await connect();
  try {
    await migrate(client);
    console.log('PostgreSQL schema migrations verified.');
  } finally {
    await client.end();
  }
})().catch(report);
