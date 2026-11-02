const { randomUUID, createHash } = require('node:crypto');
const { id, allPages, subscriptionEnded, check } = require('./evidence');
const { failure } = require('../identity/service');
const { retryOnConflict } = require('./service');
const createRequestBudget = require('./budget');

// PostgreSQL JSONB can reorder keys. Hash a stable representation so a retry
// cannot change the parameters attached to the operation's idempotency key.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical(value[key])])
  );
}
const digest = (parameters) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(parameters)))
    .digest('hex');
const withinRetryWindow = (operation, now) => now() - operation.createdAt < 23 * 3600000;
const ongoingSubscription = (subscriptions) =>
  subscriptions.some((subscription) => !subscriptionEnded(subscription.status));
const futureSchedule = (schedules) =>
  schedules.some((schedule) => !['canceled', 'completed', 'released'].includes(schedule.status));

function checkoutEnded(session, subscriptions) {
  if (!session) return false;
  if (session.status === 'expired') return true;
  return (
    session.status === 'complete' &&
    subscriptions.some(
      (subscription) => subscription.id === id(session.subscription) && subscriptionEnded(subscription.status)
    )
  );
}

function recordedCheckout(operation, sessions) {
  if (operation.externalId) return sessions.find((session) => session.id === operation.externalId);
  const matches = sessions.filter((session) => session.metadata?.billing_operation === operation.id);
  check(matches.length <= 1, 'CHECKOUT_OUTCOME_CONFLICT');
  return matches[0];
}

function createOperations({ db, stripe, billing, clientOrigin, now = () => new Date() }) {
  async function readBillingState(customerId, request, includeInvoices = false) {
    const config = billing.settings();
    const customer = await request(() => stripe.customers.retrieve(customerId));
    check(
      customer.id === customerId && (customer.deleted || customer.livemode === config.livemode),
      'ASSOCIATION_CONFLICT'
    );
    // A failed/incomplete collection throws. It never supplies an empty list as
    // proof that another Checkout or account deletion is safe.
    const [subscriptions, schedules, sessions, invoices] = await Promise.all([
      allPages((params) => request(() => stripe.subscriptions.list(params)), {
        customer: customerId,
        status: 'all',
      }),
      allPages((params) => request(() => stripe.subscriptionSchedules.list(params)), {
        customer: customerId,
      }),
      allPages((params) => request(() => stripe.checkout.sessions.list(params)), { customer: customerId }),
      includeInvoices
        ? allPages((params) => request(() => stripe.invoices.list(params)), { customer: customerId })
        : [],
    ]);
    const records = [...subscriptions, ...schedules, ...sessions, ...invoices];
    check(
      records.every((record) => id(record.customer) === customerId && record.livemode === config.livemode),
      'ASSOCIATION_CONFLICT'
    );
    return { customer, subscriptions, schedules, sessions, invoices };
  }

  async function findCreatedObject(operation, request) {
    if (operation.kind === 'checkout') {
      if (operation.externalId) return request(() => stripe.checkout.sessions.retrieve(operation.externalId));
      const sessions = await allPages((params) => request(() => stripe.checkout.sessions.list(params)), {
        customer: operation.customerId,
      });
      return recordedCheckout(operation, sessions);
    }
    if (operation.externalId) return request(() => stripe.customers.retrieve(operation.externalId));
    const customers = await allPages((params) => request(() => stripe.customers.list(params)));
    const matches = customers.filter((customer) => customer.metadata?.billing_operation === operation.id);
    return matches.length === 1 ? matches[0] : undefined;
  }

  async function finishRegistration(operation, customer) {
    check(
      operation.kind === 'registration' && operation.digest === digest(operation.parameters),
      'OPERATION_PARAMETERS_CONFLICT'
    );
    check(
      customer &&
        !customer.deleted &&
        customer.id &&
        customer.livemode === billing.settings().livemode &&
        customer.metadata?.billing_operation === operation.id,
      'UNTRUSTED_CUSTOMER'
    );
    return db.$transaction(async (tx) => {
      const current = await tx.billingOperation.findUnique({ where: { id: operation.id } });
      check(
        current?.kind === 'registration' && (!current.externalId || current.externalId === customer.id),
        'ASSOCIATION_CONFLICT'
      );
      let customerBinding = await tx.billingCustomer.findUnique({
        where: { customerId: customer.id },
        include: { user: true },
      });
      if (customerBinding) {
        check(
          customerBinding.userId !== null &&
            !customerBinding.deletedAt &&
            customerBinding.user?.email === operation.parameters.email &&
            customerBinding.user?.stripeId === customer.id,
          'ACCOUNT_TOMBSTONE'
        );
      } else {
        const existing = await dbUserByEmail(tx, operation.parameters.email);
        check(!existing, 'REGISTRATION_CONFLICT');
        const user = await tx.user.create({
          data: { ...operation.parameters, stripeId: customer.id, isAdmin: false },
        });
        customerBinding = await tx.billingCustomer.create({
          data: { customerId: customer.id, userId: user.id, livemode: billing.settings().livemode },
        });
      }
      await tx.billingOperation.update({
        where: { id: operation.id },
        data: {
          state: 'completed',
          externalId: customer.id,
          customerId: customer.id,
          userId: customerBinding.userId,
          completedAt: now(),
        },
      });
      return customer.id;
    });
  }

  async function dbUserByEmail(database, email) {
    const users = await database.user.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      take: 1,
    });
    return users[0];
  }

  async function register(parameters) {
    billing.settings();
    if (await dbUserByEmail(db, parameters.email)) throw failure(409, 'Registration cannot be completed');
    const activeKey = 'registration:' + digest(parameters.email);
    const operation = await db.billingOperation.upsert({
      where: { activeKey },
      create: {
        id: randomUUID(),
        activeKey,
        kind: 'registration',
        digest: digest(parameters),
        parameters,
        createdAt: now(),
      },
      update: {},
    });
    if (
      operation.kind !== 'registration' ||
      operation.digest !== digest(operation.parameters) ||
      operation.digest !== digest(parameters) ||
      operation.state === 'review'
    )
      throw failure(409, 'Registration needs review');

    const request = createRequestBudget();
    const canRepeatPost = !operation.externalId && withinRetryWindow(operation, now);
    const customer = canRepeatPost
      ? await request(() =>
          stripe.customers.create(
            {
              name: `${parameters.firstName} ${parameters.lastName}`,
              email: parameters.email,
              metadata: { billing_operation: operation.id },
            },
            { idempotencyKey: operation.id }
          )
        )
      : await findCreatedObject(operation, request);
    if (!customer) throw failure(409, 'Registration needs provider outcome review');
    return retryOnConflict(() => finishRegistration(operation, customer));
  }

  async function recoverCustomer(customerId) {
    if (await db.billingCustomer.findUnique({ where: { customerId } })) return;
    const request = createRequestBudget();
    const customer = await request(() => stripe.customers.retrieve(customerId));
    const operationId = customer.metadata?.billing_operation;
    check(typeof operationId === 'string', 'UNTRUSTED_CUSTOMER');
    const operation = await db.billingOperation.findUnique({ where: { id: operationId } });
    check(operation?.kind === 'registration', 'UNTRUSTED_CUSTOMER');
    await finishRegistration(operation, customer);
  }

  function validateCheckout(session, customerBinding) {
    check(
      id(session.customer) === customerBinding.customerId &&
        session.livemode === billing.settings().livemode &&
        session.mode === 'subscription',
      'ASSOCIATION_CONFLICT'
    );
  }

  async function finishCheckout(operation, customerBinding, session) {
    validateCheckout(session, customerBinding);
    return db.$transaction(async (tx) => {
      await billing.revise(tx, customerBinding);
      const owner = await tx.checkoutOwnership.findUnique({ where: { sessionId: session.id } });
      check(
        !owner ||
          (owner.userId === customerBinding.userId && owner.customerId === customerBinding.customerId),
        'ASSOCIATION_CONFLICT'
      );
      await tx.checkoutOwnership.upsert({
        where: { sessionId: session.id },
        create: {
          sessionId: session.id,
          userId: customerBinding.userId,
          customerId: customerBinding.customerId,
        },
        update: {},
      });
      await tx.billingOperation.update({
        where: { id: operation.id },
        data: {
          externalId: session.id,
          state: 'completed',
          completedAt: now(),
        },
      });
    });
  }

  async function executeCheckout(operation, knownSessionId) {
    check(
      operation.kind === 'checkout' && operation.digest === digest(operation.parameters),
      'OPERATION_PARAMETERS_CONFLICT'
    );
    const customerBinding = await billing.binding(operation.customerId);
    if (
      customerBinding.deletedAt ||
      customerBinding.deletionRequestedAt ||
      customerBinding.userId !== operation.userId
    )
      throw failure(409, 'Billing closure pending');
    const request = createRequestBudget();
    const sessionId = operation.externalId || knownSessionId;
    let session;
    if (sessionId) session = await request(() => stripe.checkout.sessions.retrieve(sessionId));
    else if (withinRetryWindow(operation, now)) {
      const { line_items: items, customer, mode } = operation.parameters;
      check(
        items?.length === 1 &&
          items[0].price === billing.settings().priceId &&
          items[0].quantity === 1 &&
          customer === operation.customerId &&
          mode === 'subscription',
        'CHECKOUT_CONFIGURATION_CONFLICT'
      );
      // The original key safely repeats this POST. A second history scan adds
      // no protection inside its retry window. Old/uncertain keys use discovery.
      session = await request(() =>
        stripe.checkout.sessions.create(operation.parameters, { idempotencyKey: operation.id })
      );
    } else session = await findCreatedObject(operation, request);
    if (!session) throw failure(409, 'Checkout needs provider outcome review');
    validateCheckout(session, customerBinding);
    if (session.status !== 'open') throw failure(409, 'Checkout already finished; refresh billing');
    await finishCheckout(operation, customerBinding, session);
    return session;
  }

  async function reserveCheckout(customerBinding, previous, legacySession) {
    const operationId = randomUUID();
    const parameters = legacySession
      ? { sessionId: legacySession.id }
      : {
          customer: customerBinding.customerId,
          line_items: [{ price: billing.settings().priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: `${clientOrigin}/complete-registration?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${clientOrigin}/manage-account`,
          metadata: { billing_operation: operationId },
        };
    return db.$transaction(async (tx) => {
      await billing.revise(tx, customerBinding);
      if (previous)
        await tx.billingOperation.update({ where: { id: previous.id }, data: { activeKey: null } });
      return tx.billingOperation.create({
        data: {
          id: operationId,
          activeKey: 'checkout:' + customerBinding.customerId,
          kind: 'checkout',
          userId: customerBinding.userId,
          customerId: customerBinding.customerId,
          digest: digest(parameters),
          parameters,
          createdAt: now(),
          ...(legacySession ? { externalId: legacySession.id, state: 'completed', completedAt: now() } : {}),
        },
      });
    });
  }

  async function checkout(user) {
    const request = createRequestBudget();
    return retryOnConflict(async () => {
      const customerBinding = await billing.binding(user.stripeId);
      check(
        customerBinding.userId === user.id && !customerBinding.deletedAt && !customerBinding.stripeDeletedAt,
        'ASSOCIATION_CONFLICT'
      );
      if (customerBinding.deletionRequestedAt) throw failure(409, 'Billing closure pending');
      const state = await readBillingState(customerBinding.customerId, request);
      check(
        !state.customer.deleted &&
          (customerBinding.livemode === null || customerBinding.livemode === billing.settings().livemode),
        'ASSOCIATION_CONFLICT'
      );
      if (ongoingSubscription(state.subscriptions) || futureSchedule(state.schedules))
        throw failure(409, 'An ongoing subscription or schedule already exists');
      const activeKey = 'checkout:' + customerBinding.customerId;
      let operation = await db.billingOperation.findUnique({ where: { activeKey } });
      const open = state.sessions.filter((session) => session.status === 'open');
      if (!operation && open.length === 1 && open[0].mode === 'subscription') {
        const owner = await db.checkoutOwnership.findUnique({ where: { sessionId: open[0].id } });
        if (owner?.userId === user.id && owner.customerId === customerBinding.customerId) {
          operation = await reserveCheckout(customerBinding, null, open[0]);
        }
      }
      const session = operation && recordedCheckout(operation, state.sessions);
      if (open.some((other) => other.id !== session?.id))
        throw failure(409, 'An unresolved Checkout already exists');
      if (operation && (!session || session.status === 'open'))
        return executeCheckout(operation, session?.id);
      if (operation && !checkoutEnded(session, state.subscriptions))
        throw failure(409, 'Checkout outcome is unresolved');
      operation = await reserveCheckout(customerBinding, operation);
      return executeCheckout(operation);
    });
  }

  async function deleteAccount(userId) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw failure(404, 'Account not found');
    const request = createRequestBudget();
    return retryOnConflict(async () => {
      let customerBinding = await billing.binding(user.stripeId);
      check(customerBinding.userId === userId, 'ASSOCIATION_CONFLICT');
      if (!customerBinding.deletionRequestedAt) {
        await db.$transaction((tx) => billing.revise(tx, customerBinding, { deletionRequestedAt: now() }));
        customerBinding = await billing.binding(user.stripeId);
      }
      const state = await readBillingState(customerBinding.customerId, request, true);
      const operations = await db.billingOperation.findMany({
        where: { customerId: customerBinding.customerId, kind: 'checkout' },
      });
      const unresolved = operations.some(
        (operation) => !checkoutEnded(recordedCheckout(operation, state.sessions), state.subscriptions)
      );
      const pendingCheckout = state.sessions.some(
        (session) =>
          session.status === 'open' ||
          (session.mode === 'subscription' &&
            session.status === 'complete' &&
            !checkoutEnded(session, state.subscriptions))
      );
      const collectibleInvoice = state.invoices.some(
        (invoice) => ['draft', 'open'].includes(invoice.status) || invoice.next_payment_attempt
      );
      if (
        ongoingSubscription(state.subscriptions) ||
        futureSchedule(state.schedules) ||
        pendingCheckout ||
        collectibleInvoice ||
        unresolved
      )
        throw failure(409, 'Billing closure must be confirmed before deletion');
      await db.$transaction(async (tx) => {
        await billing.revise(tx, customerBinding, { deletedAt: now() });
        await tx.user.delete({ where: { id: userId } });
      });
    });
  }

  async function recoverPending({ apply = false, limit = 10 } = {}) {
    const request = createRequestBudget();
    const pending = await db.billingOperation.findMany({
      where: { state: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    const report = { examined: pending.length, recoverable: 0, applied: 0, unresolved: 0, failures: 0 };
    for (const operation of pending) {
      try {
        check(operation.digest === digest(operation.parameters), 'OPERATION_PARAMETERS_CONFLICT');
        // Read the customer revision before retrieving a Checkout. Recovering an
        // already-created object remains allowed while deletion is pending.
        const customerBinding =
          operation.kind === 'checkout' ? await billing.binding(operation.customerId) : null;
        if (customerBinding)
          check(
            customerBinding.userId === operation.userId &&
              customerBinding.userId !== null &&
              !customerBinding.deletedAt,
            'ASSOCIATION_CONFLICT'
          );
        const result = await findCreatedObject(operation, request);
        if (!result) {
          report.unresolved++;
          continue;
        }
        if (operation.kind === 'registration') {
          check(
            !result.deleted &&
              result.livemode === billing.settings().livemode &&
              result.metadata?.billing_operation === operation.id,
            'UNTRUSTED_CUSTOMER'
          );
          if (apply) await finishRegistration(operation, result);
        } else {
          validateCheckout(result, customerBinding);
          check(['open', 'complete', 'expired'].includes(result.status), 'ASSOCIATION_CONFLICT');
          if (apply) await finishCheckout(operation, customerBinding, result);
        }
        report.recoverable++;
        if (apply) report.applied++;
      } catch {
        report.failures++;
      }
    }
    return report;
  }
  return { register, recoverCustomer, checkout, deleteAccount, recoverPending };
}
module.exports = { createOperations };
