// Add stateful catalog delegates to the existing identity fixture. Production
// controllers still run; this double does not model Prisma constraints or SQL.
module.exports = function addCatalogDatabase(db, calls) {
  const models = ['artist', 'category', 'event', 'location', 'mediaType', 'raga',
    'tape', 'track', 'tribute', 'trackPlay', 'networkError'];
  for (const model of models) {
    db.tables[model] = [];
    const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => row[key] === value);
    const record = (method, action) => async (args = {}) => {
      calls.push(model + '.' + method);
      return structuredClone(action(args));
    };
    db[model] = {
      findMany: record('findMany', ({ where }) => db.tables[model].filter(row => matches(row, where))),
      findUnique: record('findUnique', ({ where }) => db.tables[model].find(row => matches(row, where)) || null),
      create: record('create', args => {
        // trackPlay's existing controller passes fields without a data wrapper.
        const row = { id: Math.max(0, ...db.tables[model].map(row => row.id)) + 1, ...(args.data || args) };
        db.tables[model].push(row);
        return row;
      }),
      update: record('update', ({ where, data }) => {
        const row = db.tables[model].find(row => matches(row, where));
        if (!row) throw new Error('Synthetic missing catalog row');
        Object.assign(row, data);
        return row;
      }),
      delete: record('delete', ({ where }) => {
        const row = db.tables[model].find(row => matches(row, where));
        if (!row) throw new Error('Synthetic missing catalog row');
        db.tables[model] = db.tables[model].filter(item => item !== row);
        return row;
      }),
    };
  }
};
