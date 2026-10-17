// Run after NocoDB becomes healthy. Railway redeploys run this again, so every
// operation checks the existing metadata before it creates anything.
const { Client } = require('/usr/src/app/node_modules/pg');

const url = process.argv[2];
const env = process.env;
const baseTitle = 'Mokart';
const sourceAlias = 'Mokart PostgreSQL';

for (const name of [
  'NC_ADMIN_EMAIL', 'NC_ADMIN_PASSWORD', 'NC_APP_DB_HOST', 'NC_APP_DB_NAME',
  'NC_APP_DB_USER', 'NC_APP_DB_PASSWORD', 'NC_APP_DB_ADMIN_USER', 'NC_APP_DB_ADMIN_PASSWORD',
]) {
  if (!env[name]) throw new Error(`Missing ${name}`);
}

if (env.NC_APP_DB_USER === env.NC_APP_DB_ADMIN_USER) {
  throw new Error('NC_APP_DB_USER must be a dedicated read-only role');
}

const port = Number(env.NC_APP_DB_PORT || 5432);

async function ensureReadOnlyRole() {
  const client = new Client({
    host: env.NC_APP_DB_HOST,
    port,
    user: env.NC_APP_DB_ADMIN_USER,
    password: env.NC_APP_DB_ADMIN_PASSWORD,
    database: env.NC_APP_DB_NAME,
  });
  await client.connect();
  try {
    const role = client.escapeIdentifier(env.NC_APP_DB_USER);
    const owner = client.escapeIdentifier(env.NC_APP_DB_ADMIN_USER);
    const database = client.escapeIdentifier(env.NC_APP_DB_NAME);
    const password = client.escapeLiteral(env.NC_APP_DB_PASSWORD);
    const existing = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [env.NC_APP_DB_USER]);
    if (existing.rowCount === 0) {
      await client.query(`CREATE ROLE ${role}`);
      console.log('Mokart: read-only PostgreSQL role created');
    }
    for (const statement of [
      `ALTER ROLE ${role} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${password}`,
      `ALTER ROLE ${role} SET default_transaction_read_only = on`,
      `GRANT CONNECT ON DATABASE ${database} TO ${role}`,
      `GRANT USAGE ON SCHEMA public TO ${role}`,
      `GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${role}`,
      `ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public GRANT SELECT ON TABLES TO ${role}`,
    ]) {
      await client.query(statement);
    }
  } finally {
    await client.end();
  }
}

async function request(path, token, method = 'GET', body) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'xc-auth': token } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // NocoDB error bodies can contain connection strings and credentials.
    throw new Error(`${method} ${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function run() {
  await ensureReadOnlyRole();

  const login = await request('/api/v1/auth/user/signin', null, 'POST', {
    email: env.NC_ADMIN_EMAIL,
    password: env.NC_ADMIN_PASSWORD,
  });
  if (!login.token) throw new Error('NocoDB admin sign-in did not return a token');
  const token = login.token;

  await request('/api/v1/app-settings', token, 'POST', {
    invite_only_signup: true,
    restrict_workspace_creation: true,
  });

  const workspaces = await request('/api/v3/meta/workspaces', token);
  const workspace = workspaces.list?.[0];
  if (!workspace) throw new Error('NocoDB has no workspace');

  const bases = await request(`/api/v3/meta/workspaces/${workspace.id}/bases`, token);
  let base = bases.list?.find(item => item.title === baseTitle);
  if (!base) {
    base = await request(`/api/v3/meta/workspaces/${workspace.id}/bases`, token, 'POST', {
      title: baseTitle,
    });
    console.log('Mokart: NocoDB base created');
  }

  const config = {
    client: 'pg',
    connection: {
      host: env.NC_APP_DB_HOST,
      port,
      user: env.NC_APP_DB_USER,
      password: env.NC_APP_DB_PASSWORD,
      database: env.NC_APP_DB_NAME,
    },
    searchPath: ['public'],
  };

  const sourcesPath = `/api/v2/meta/bases/${base.id}/sources/`;
  const sources = await request(sourcesPath, token);
  // The list endpoint omits `external`, even for external PostgreSQL sources.
  const source = sources.list?.find(item => item.alias === sourceAlias && item.type === 'pg');
  if (!source) {
    await request(sourcesPath, token, 'POST', {
      alias: sourceAlias,
      type: 'pg',
      external: true,
      is_schema_readonly: true,
      is_data_readonly: true,
      config,
    });
    console.log('Mokart: read-only PostgreSQL source created');
    return;
  }

  if (!source.is_schema_readonly || !source.is_data_readonly) {
    throw new Error('Existing Mokart PostgreSQL source is not read-only');
  }
  const details = await request(`${sourcesPath}${source.id}`, token);
  if (!details.fk_integration_id) throw new Error('Mokart PostgreSQL source has no integration');
  const integrationPath = `/api/v2/meta/integrations/${details.fk_integration_id}`;
  const integration = await request(`${integrationPath}?includeConfig=true`, token);
  await request(integrationPath, token, 'PATCH', {
    title: integration.title,
    type: integration.type,
    sub_type: integration.sub_type,
    config: { ...integration.config, ...config },
  });
  console.log('Mokart: PostgreSQL source verified with the read-only role');
}

run().catch(error => {
  console.error(`Mokart: NocoDB bootstrap: ${error.message}`);
  process.exitCode = 1;
});
