// Fail closed when a database test is invoked outside the isolated test runner.
if (
  !/^vp_test_[a-f0-9]{32}$/.test(process.env.DATABASE_SCHEMA || '') ||
  !process.env.DATABASE_URL
) {
  throw Error(
    'Run database tests with node scripts/test-postgres.cjs <test file>. A disposable PostgreSQL schema is required.',
  );
}
