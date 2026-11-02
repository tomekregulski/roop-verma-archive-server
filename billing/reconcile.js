const { check } = require('./evidence');
// Each invoice page is routing only; sync rereads every authoritative object
// after the customer revision. Progress commits with the page's projections.
async function reconcileCustomer({
  db,
  stripe,
  billing,
  customerId,
  apply = false,
  restart = false,
  limit = 10,
}) {
  check(Number.isInteger(limit) && limit > 0 && limit <= 100, 'INVALID_BATCH');
  const customerBinding = await billing.binding(customerId);
  const cursor = restart ? null : customerBinding.reconcileCursor;
  const result = await stripe.invoices.list({
    customer: customerId,
    limit,
    ...(cursor ? { starting_after: cursor } : {}),
  });
  check(
    Array.isArray(result?.data) &&
      typeof result.has_more === 'boolean' &&
      (!result.has_more || result.data.length),
    'INCOMPLETE_PAGE'
  );
  check(
    new Set(result.data.map((i) => i.id)).size === result.data.length &&
      result.data.every((i) => typeof i.id === 'string' && i.id !== cursor),
    'INCONSISTENT_PAGE'
  );
  const next = result.has_more ? result.data.at(-1).id : null;
  const report = await billing.sync(customerId, {
    invoiceIds: result.data.map((i) => i.id),
    inspect: !apply,
    progress: apply ? { reconcileCursor: next, ...(next ? {} : { lastFullScanAt: new Date() }) } : undefined,
    expectedCursor: customerBinding.reconcileCursor,
  });
  return { ...report, complete: !result.has_more, cursor: next };
}
async function reconcileBatch({
  db,
  stripe,
  billing,
  operations,
  apply = false,
  after,
  limit = 10,
  invoiceLimit = 10,
}) {
  check(Number.isInteger(limit) && limit > 0 && limit <= 100, 'INVALID_BATCH');
  const operationReport = operations ? await operations.recoverPending({ apply, limit }) : null;
  const bindings = await db.billingCustomer.findMany({
    where: after ? { customerId: { gt: after } } : {},
    orderBy: { customerId: 'asc' },
    take: limit + 1,
  });
  const report = {
    customers: 0,
    invoices: 0,
    reviews: 0,
    failures: operationReport?.failures || 0,
    complete: !(operationReport?.failures || operationReport?.unresolved),
    cursor: after || null,
    ...(operationReport ? { operations: operationReport } : {}),
  };
  for (const customerBinding of bindings.slice(0, limit)) {
    try {
      const result = await reconcileCustomer({
        db,
        stripe,
        billing,
        customerId: customerBinding.customerId,
        apply,
        limit: invoiceLimit,
      });
      report.invoices += result.invoices;
      if (result.outcome === 'review' || result.issues?.length) report.reviews++;
      if (!result.complete) {
        report.complete = false;
        break;
      } // Resume this customer before advancing customer cursor.
      report.customers++;
      report.cursor = customerBinding.customerId;
    } catch {
      report.failures++;
      report.complete = false;
      break;
    }
  }
  if (bindings.length > limit) report.complete = false;
  // Applied receipts are deliberately not authoritative for projection repair.
  // Full resource scans above recover missing/corrupt projections independently.
  if (apply) {
    const pending = await db.stripeEventReceipt.findMany({
      where: { outcome: { in: ['pending', 'review'] } },
      orderBy: { receivedAt: 'asc' },
      take: 100,
    });
    for (const receipt of pending) {
      try {
        await billing.replayReceipt(receipt);
      } catch {
        report.failures++;
        report.complete = false;
      }
    }
  }
  return report;
}
module.exports = { reconcileCustomer, reconcileBatch };
