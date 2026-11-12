const { connect, schemaName, report } = require('./postgres-tools.cjs');
const expectedColumns = {
  users: 'id,name,email,password,role,active',
  sessions: 'token,user_id,expires',
  attempts: 'email,count,until_at',
  enquiries: 'id,customer_id,assigned_to,destination,requirements,status,followup,notes,created_at',
  activity: 'id,actor_id,message,created_at',
  customer_profiles: 'user_id,phone,city,address,preferences,updated_at',
  admin_leads: 'id,payload,submission_key',
  travel_bookings: 'id,quote_id,payload',
  booking_payments: 'id,booking_id,payload',
  website_booking_requests: 'request_key,booking_id',
  website_content: 'id,revision,payload,updated_at',
  website_reviews: 'id,name,destination,rating,body,published,permission,created_at',
  travel_feature_migrations: 'version,applied_at',
  trip_plans: 'booking_id,revision,coordinator,draft,published,published_at',
  trip_services: 'id,booking_id,kind,status,fields,updated_at',
  trip_documents: 'id,service_id,name,mime,size,content',
  trip_notifications: 'id,booking_id,message,created_at,is_read',
};
async function verify(client) {
  const schema = schemaName();
  const columns = (
    await client.query(
      'SELECT table_name,column_name,data_type,is_identity FROM information_schema.columns WHERE table_schema=$1 ORDER BY ordinal_position',
      [schema],
    )
  ).rows;
  const constraints = (
    await client.query(
      'SELECT t.relname table_name,c.contype,c.convalidated,pg_get_constraintdef(c.oid) definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=$1',
      [schema],
    )
  ).rows;
  const indexes = (
    await client.query('SELECT indexname,indexdef FROM pg_indexes WHERE schemaname=$1', [schema])
  ).rows;
  const requiredFks = {
    sessions: 1,
    enquiries: 2,
    activity: 1,
    customer_profiles: 1,
    booking_payments: 1,
    website_booking_requests: 1,
    trip_plans: 1,
    trip_services: 1,
    trip_documents: 1,
    trip_notifications: 1,
  };
  const counts = {};
  for (const [table, list] of Object.entries(expectedColumns)) {
    const actual = columns.filter((c) => c.table_name === table);
    const names = actual.map((c) => c.column_name);
    if ([...list.split(','), 'insertion_order'].some((c) => !names.includes(c)))
      throw Error('Missing PostgreSQL columns in ' + table);
    if (!actual.some((c) => c.column_name === 'insertion_order' && c.is_identity === 'YES'))
      throw Error('Missing ordering identity in ' + table);
    const own = constraints.filter((c) => c.table_name === table);
    if (!own.some((c) => c.contype === 'p') || own.some((c) => !c.convalidated))
      throw Error('Missing or unvalidated constraints in ' + table);
    if (own.filter((c) => c.contype === 'f').length !== (requiredFks[table] || 0))
      throw Error('Foreign key count differs in ' + table);
    counts[table] = Number(
      (await client.query(`SELECT count(*) count FROM "${schema}"."${table}"`)).rows[0].count,
    );
  }
  for (const name of ['booking_quote_unique', 'trip_service_booking', 'trip_notification_booking'])
    if (!indexes.some((i) => i.indexname === name)) throw Error('Missing index ' + name);
  if (
    !indexes.some(
      (i) =>
        i.indexname === 'booking_quote_unique' &&
        /UNIQUE/.test(i.indexdef) &&
        /WHERE/.test(i.indexdef),
    )
  )
    throw Error('Booking quotation partial unique index is invalid.');
  if (
    !constraints.some(
      (c) => c.table_name === 'users' && c.contype === 'u' && c.definition.includes('(email)'),
    )
  )
    throw Error('Missing unique user email.');
  if (
    !constraints.some(
      (c) =>
        c.table_name === 'admin_leads' &&
        c.contype === 'u' &&
        c.definition.includes('(submission_key)'),
    )
  )
    throw Error('Missing unique lead submission key.');
  for (const [table, count] of [
    ['users', 1],
    ['website_content', 1],
    ['trip_services', 2],
  ])
    if (constraints.filter((c) => c.table_name === table && c.contype === 'c').length !== count)
      throw Error('Check constraints differ in ' + table);
  if (
    !constraints.some(
      (c) =>
        c.table_name === 'trip_documents' &&
        c.contype === 'f' &&
        c.definition.includes('ON DELETE CASCADE'),
    )
  )
    throw Error('Missing document delete cascade.');
  for (const [table, column, type] of [
    ['sessions', 'expires', 'bigint'],
    ['attempts', 'until_at', 'bigint'],
    ['trip_documents', 'content', 'bytea'],
  ])
    if (
      !columns.some(
        (c) => c.table_name === table && c.column_name === column && c.data_type === type,
      )
    )
      throw Error('Invalid PostgreSQL data type in ' + table);
  return {
    schema,
    tables: Object.keys(counts).length,
    indexes: indexes.length,
    constraints: constraints.length,
    rowCounts: counts,
  };
}
module.exports = { verify };
if (require.main === module)
  (async () => {
    const client = await connect();
    try {
      console.log(JSON.stringify(await verify(client), null, 2));
    } finally {
      await client.end();
    }
  })().catch(report);
