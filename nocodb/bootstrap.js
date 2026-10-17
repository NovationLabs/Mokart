// Run after NocoDB becomes healthy. Railway redeploys run this again, so every
// operation checks the existing metadata before it creates anything.
const url = process.argv[2];
const env = process.env;
const baseTitle = 'Mokart';
const sourceAlias = 'Mokart PostgreSQL';

for (const name of [
  'NC_ADMIN_EMAIL', 'NC_ADMIN_PASSWORD', 'NC_APP_DB_HOST',
  'NC_APP_DB_USER', 'NC_APP_DB_PASSWORD', 'NC_APP_DB_NAME',
]) {
  if (!env[name]) throw new Error(`Missing ${name}`);
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
      config: {
        client: 'pg',
        connection: {
          host: env.NC_APP_DB_HOST,
          port: Number(env.NC_APP_DB_PORT || 5432),
          user: env.NC_APP_DB_USER,
          password: env.NC_APP_DB_PASSWORD,
          database: env.NC_APP_DB_NAME,
        },
        searchPath: ['public'],
      },
    });
    console.log('Mokart: read-only PostgreSQL source created');
  } else {
    if (!source.is_schema_readonly || !source.is_data_readonly) {
      throw new Error('Existing Mokart PostgreSQL source is not read-only');
    }
    console.log('Mokart: existing PostgreSQL source verified');
  }
}

run().catch(error => {
  console.error(`Mokart: NocoDB bootstrap: ${error.message}`);
  process.exitCode = 1;
});
