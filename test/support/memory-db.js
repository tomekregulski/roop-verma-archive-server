// Deliberately synthetic storage. Its serial transaction double is NOT evidence
// of PostgreSQL isolation, migrations or multi-connection concurrency.
module.exports = function memoryDatabase(calls) {
  const tables = Object.fromEntries(['user', 'subscription', 'loginProof', 'identitySession', 'checkoutOwnership', 'identityRateLimit'].map(name => [name, []]));
  let failSession = false;
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => {
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('gt' in value) return row[key] > value.gt;
      if ('lt' in value) return row[key] < value.lt;
      if ('equals' in value) return value.mode === 'insensitive' ? row[key].toLowerCase() === value.equals.toLowerCase() : row[key] === value.equals;
    }
    return row[key] === value;
  });
  const db = { tables, failNextSession() { failSession = true; } };
  for (const name of Object.keys(tables)) {
    const record = (method, fn) => async (args = {}) => {
      calls.push(name + '.' + method);
      return fn(args);
    };
    const defaults = data => ({ ...(name === 'loginProof' ? { delivered: false, consumedAt: null } : {}),
      ...(name === 'identitySession' ? { revokedAt: null } : {}), ...data });
    db[name] = {
      findUnique: record('findUnique', ({ where, include }) => {
        const row = tables[name].find(row => matches(row, where));
        return row ? structuredClone({ ...row, ...(include?.user ? { user: tables.user.find(u => u.id === row.userId) || null } : {}) }) : null;
      }),
      findMany: record('findMany', ({ where, take }) => structuredClone(tables[name].filter(row => matches(row, where)).slice(0, take))),
      create: record('create', ({ data }) => {
        if (name === 'identitySession' && failSession) { failSession = false; throw new Error('synthetic session storage failure'); }
        const row = defaults(data);
        tables[name].push(row);
        return structuredClone(row);
      }),
      updateMany: record('updateMany', ({ where, data }) => {
        const rows = tables[name].filter(row => matches(row, where));
        rows.forEach(row => Object.assign(row, data));
        return { count: rows.length };
      }),
      deleteMany: record('deleteMany', ({ where }) => {
        const rows = tables[name].filter(row => !matches(row, where));
        const count = tables[name].length - rows.length;
        tables[name] = rows;
        return { count };
      }),
      delete: record('delete', ({ where }) => {
        const row = tables[name].find(row => matches(row, where));
        if (!row) throw new Error('synthetic missing row');
        tables[name] = tables[name].filter(r => r !== row);
        if (name === 'user') for (const child of ['subscription', 'loginProof', 'identitySession', 'checkoutOwnership']) {
          tables[child] = tables[child].filter(r => r.userId !== row.id);
        }
        return structuredClone(row);
      }),
    };
  }
  db.$queryRaw = async (_strings, key, expiresAt, ceiling) => {
    calls.push('rateLimit.increment');
    let row = tables.identityRateLimit.find(row => row.key === key);
    if (!row) { row = { key, count: 0, expiresAt }; tables.identityRateLimit.push(row); }
    row.count = Math.min(row.count + 1, ceiling);
    return [{ count: row.count }];
  };
  let tail = Promise.resolve();
  db.$transaction = async work => {
    let release;
    const previous = tail;
    tail = new Promise(resolve => { release = resolve; });
    await previous;
    const snapshot = structuredClone(tables);
    try { return await work(db); }
    catch (error) { Object.assign(tables, snapshot); throw error; }
    finally { release(); }
  };
  return db;
};
