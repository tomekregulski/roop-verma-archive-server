// Deliberately synthetic storage. Its serial transaction double is NOT evidence
// of PostgreSQL isolation, migrations or multi-connection concurrency.
module.exports = function memoryDatabase(calls) {
  const tables = Object.fromEntries(
    [
      'user',
      'subscription',
      'loginProof',
      'identitySession',
      'checkoutOwnership',
      'identityRateLimit',
      'billingCustomer',
      'paidInvoiceGrant',
      'stripeEventReceipt',
      'billingOperation',
    ].map((name) => [name, []])
  );
  let failSession = false;
  const matches = (row, where = {}) =>
    Object.entries(where).every(([key, value]) => {
      if (key === 'OR') return value.some((condition) => matches(row, condition));
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        if ('in' in value) return value.in.includes(row[key]);
        if ('gt' in value) return row[key] > value.gt;
        if ('lt' in value) return row[key] < value.lt;
        if ('equals' in value)
          return value.mode === 'insensitive'
            ? row[key].toLowerCase() === value.equals.toLowerCase()
            : row[key] === value.equals;
      }
      return row[key] === value;
    });
  const db = {
    tables,
    failNextSession() {
      failSession = true;
    },
  };
  for (const name of Object.keys(tables)) {
    const record =
      (method, fn) =>
      async (args = {}) => {
        calls.push(name + '.' + method);
        return fn(args);
      };
    const defaults = (data) => ({
      ...(name === 'loginProof' ? { delivered: false, consumedAt: null } : {}),
      ...(name === 'identitySession' ? { revokedAt: null } : {}),
      ...(name === 'billingCustomer'
        ? {
            revision: 0,
            livemode: null,
            userId: null,
            deletedAt: null,
            deletionRequestedAt: null,
            stripeDeletedAt: null,
            syncIssueCode: null,
            reconcileCursor: null,
            selectedSubscriptionId: null,
            selectedCanceledAt: null,
            accessCheckedAt: null,
            accessPolicyKey: null,
            cachedPaidFrom: null,
            cachedPaidThrough: null,
            accessFreshUntil: null,
          }
        : {}),
      ...(name === 'stripeEventReceipt'
        ? { outcome: 'pending', attempts: 0, receivedAt: new Date(), errorCode: null }
        : {}),
      ...(name === 'billingOperation' ? { state: 'pending', createdAt: new Date(), externalId: null } : {}),
      ...(name === 'user' ? { stripeId: null, deletionRequestedAt: null, id: Math.max(0, ...tables.user.map((u) => u.id || 0)) + 1 } : {}),
      ...data,
    });
    const change = (row, data) => {
      for (const [k, v] of Object.entries(data))
        row[k] = v && typeof v === 'object' && 'increment' in v ? (row[k] || 0) + v.increment : v;
      return structuredClone(row);
    };
    db[name] = {
      update: record('update', ({ where, data }) => {
        const row = tables[name].find((r) => matches(r, where));
        if (!row) throw new Error('missing row');
        return change(row, data);
      }),
      upsert: record('upsert', ({ where, create, update }) => {
        const row = tables[name].find((r) => matches(r, where));
        if (row) return change(row, update);
        const made = defaults(create);
        tables[name].push(made);
        return structuredClone(made);
      }),
      count: record('count', ({ where }) => tables[name].filter((r) => matches(r, where)).length),
      findUnique: record('findUnique', ({ where, include }) => {
        const row = tables[name].find((row) => matches(row, where));
        return row
          ? structuredClone({
              ...row,
              ...(include?.user ? { user: tables.user.find((u) => u.id === row.userId) || null } : {}),
              ...(include?.subscriptions
                ? {
                    subscriptions: tables.subscription
                      .filter((s) => s.stripeId === row.customerId)
                      .map((s) => ({
                        ...s,
                        grants: tables.paidInvoiceGrant.filter((g) => g.subscriptionId === s.id),
                      })),
                  }
                : {}),
            })
          : null;
      }),
      findMany: record('findMany', ({ where, take, orderBy }) => {
        let rows = tables[name].filter((row) => matches(row, where));
        if (orderBy && !Array.isArray(orderBy)) {
          const [key, dir] = Object.entries(orderBy)[0];
          rows = [...rows].sort(
            (a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (dir === 'desc' ? -1 : 1)
          );
        }
        return structuredClone(rows.slice(0, take));
      }),
      create: record('create', ({ data }) => {
        if (name === 'identitySession' && failSession) {
          failSession = false;
          throw new Error('synthetic session storage failure');
        }
        const row = defaults(data);
        tables[name].push(row);
        return structuredClone(row);
      }),
      updateMany: record('updateMany', ({ where, data }) => {
        const rows = tables[name].filter((row) => matches(row, where));
        rows.forEach((row) => change(row, data));
        return { count: rows.length };
      }),
      deleteMany: record('deleteMany', ({ where }) => {
        const rows = tables[name].filter((row) => !matches(row, where));
        const count = tables[name].length - rows.length;
        tables[name] = rows;
        return { count };
      }),
      delete: record('delete', ({ where }) => {
        const row = tables[name].find((row) => matches(row, where));
        if (!row) throw new Error('synthetic missing row');
        tables[name] = tables[name].filter((r) => r !== row);
        if (name === 'user')
          for (const child of ['loginProof', 'identitySession', 'checkoutOwnership']) {
            tables[child] = tables[child].filter((r) => r.userId !== row.id);
          }
        if (name === 'user')
          for (const child of ['subscription', 'billingCustomer', 'billingOperation'])
            for (const r of tables[child]) if (r.userId === row.id) r.userId = null;
        return structuredClone(row);
      }),
    };
  }
  db.$queryRaw = async (_strings, key, expiresAt, ceiling) => {
    if (_strings.join('').includes('pg_advisory_xact_lock') || _strings.join('').includes('FOR UPDATE')) return [];
    calls.push('rateLimit.increment');
    let row = tables.identityRateLimit.find((row) => row.key === key);
    if (!row) {
      row = { key, count: 0, expiresAt };
      tables.identityRateLimit.push(row);
    }
    row.count = Math.min(row.count + 1, ceiling);
    return [{ count: row.count }];
  };
  let tail = Promise.resolve();
  db.$transaction = async (work) => {
    let release;
    const previous = tail;
    tail = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    const snapshot = structuredClone(tables);
    try {
      return await work(db);
    } catch (error) {
      Object.assign(tables, snapshot);
      throw error;
    } finally {
      release();
    }
  };
  return db;
};
