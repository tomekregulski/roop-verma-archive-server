// Staged D1/D8 replacement for operations.js. Only isolated fixtures compose it.
const { randomUUID, createHash } = require('node:crypto');
const { API_VERSION, id, check, stripeDate, subscriptionIssue, subscriptionEnded } = require('./evidence');
const { failure, registrationInput } = require('../identity/service');
const canonical = (v) =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === 'object'
    ? Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, canonical(v[k])])
      )
    : v;
const digest = (v) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(v)))
    .digest('hex');
const key = (userId) => 'purchase:user:' + userId;
const answer = (action, reason, operation, extra = {}) => ({
  action,
  reason,
  ...(operation ? { attempt: operation.id } : {}),
  ...extra,
});
const help = (reason, operation) => answer('help', reason, operation);
const cleared = {
  accessCheckedAt: null,
  accessPolicyKey: null,
  cachedPaidFrom: null,
  cachedPaidThrough: null,
  accessFreshUntil: null,
};
const sessionId = (value) => typeof value === 'string' && /^cs_[A-Za-z0-9_]{1,240}$/.test(value);

function createPurchase({ db, stripe, config, clientOrigin, now = () => new Date(), access }) {
  const provider = async (call) => {
    try {
      return await call();
    } catch {
      throw failure(503, 'Payment service is temporarily unavailable');
    }
  };
  const safe =
    (work) =>
    async (...args) => {
      try {
        return await work(...args);
      } catch (error) {
        if (error.code?.startsWith('PURCHASE_')) return help('purchase_needs_review');
        throw error;
      }
    };
  const settings = () => (typeof config === 'function' ? config() : config);
  const withinRetryWindow = (operation) => {
    const age = now() - operation.createdAt;
    return age >= 0 && age < 23 * 3600000;
  };
  // Serialize only local decisions. Never hold a DB lock while calling Stripe.
  const lock = (tx, scope) => tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${scope}, 0))::text`;
  async function current(database, userId) {
    const user = await database.user.findUnique({ where: { id: userId } });
    if (!user) throw failure(401, 'Authentication required');
    const binding = await database.billingCustomer.findUnique({ where: { userId } });
    check(
      !binding || (binding.customerId === user.stripeId && binding.livemode === settings().livemode),
      'PURCHASE_OWNERSHIP'
    );
    check(!user.stripeId || binding, 'PURCHASE_UNSELECTED_LEGACY_ACCOUNT');
    return { user, binding };
  }
  const blocked = ({ user, binding }) =>
    user.deletionRequestedAt ||
    binding?.deletionRequestedAt ||
    binding?.deletedAt ||
    binding?.stripeDeletedAt;
  async function locked(tx, userId) {
    await lock(tx, key(userId));
    // Also serialize with ordinary User updates/deletion that do not use our advisory lock.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    return current(tx, userId);
  }
  function trusted(operation) {
    check(
      operation?.kind === 'checkout' &&
        operation.parameters?.version === 2 &&
        operation.digest === digest(operation.parameters),
      'PURCHASE_PARAMETERS'
    );
    const p = operation.parameters.request,
      c = settings();
    check(
      p.mode === 'subscription' &&
        p.line_items?.length === 1 &&
        p.line_items[0].price === c.priceId &&
        p.line_items[0].quantity === 1 &&
        p.payment_method_types?.length === 1 &&
        p.payment_method_types[0] === 'card' &&
        p.metadata?.billing_operation === operation.id &&
        p.client_reference_id === operation.id &&
        (p.customer || null) === operation.customerId &&
        operation.parameters.livemode === c.livemode,
      'PURCHASE_CONFIGURATION'
    );
    return p;
  }
  async function register(input) {
    const parameters = registrationInput(input);
    await db.$transaction(async (tx) => {
      await lock(tx, 'registration:' + parameters.email.toLowerCase());
      const existing = await tx.user.findMany({
        where: { email: { equals: parameters.email, mode: 'insensitive' } },
        take: 2,
      });
      if (!existing.length) await tx.user.create({ data: { ...parameters, stripeId: null, isAdmin: false } });
    });
    return { accepted: true };
  }
  async function selected(binding) {
    if (!binding?.selectedSubscriptionId) return null;
    const sub = await provider(() => stripe.subscriptions.retrieve(binding.selectedSubscriptionId));
    check(
      sub?.id === binding.selectedSubscriptionId &&
        id(sub.customer) === binding.customerId &&
        sub.livemode === settings().livemode,
      'PURCHASE_SUBSCRIPTION'
    );
    check(
      [
        'active',
        'past_due',
        'unpaid',
        'incomplete',
        'paused',
        'trialing',
        'canceled',
        'incomplete_expired',
      ].includes(sub.status),
      'PURCHASE_LIFECYCLE'
    );
    return sub;
  }
  async function retrieve(operation) {
    trusted(operation);
    return provider(() =>
      stripe.checkout.sessions.retrieve(operation.externalId, { expand: ['line_items'] })
    );
  }
  function validateSession(operation, session) {
    const p = trusted(operation);
    check(
      session?.object === 'checkout.session' &&
        sessionId(session.id) &&
        (!operation.externalId || operation.externalId === session.id) &&
        session.livemode === settings().livemode &&
        session.mode === 'subscription' &&
        session.metadata?.billing_operation === operation.id &&
        session.client_reference_id === operation.id &&
        (!p.customer || id(session.customer) === p.customer) &&
        ['open', 'complete', 'expired'].includes(session.status),
      'PURCHASE_SESSION'
    );
  }
  async function remember(operation, session) {
    return db.$transaction(async (tx) => {
      const state = await locked(tx, operation.userId);
      if (blocked(state)) return help('deletion_pending', operation);
      const saved = await tx.billingOperation.findUnique({ where: { id: operation.id } });
      check(
        saved?.userId === operation.userId &&
          saved.activeKey === key(operation.userId) &&
          (!saved.externalId || saved.externalId === session.id),
        'PURCHASE_CHANGED'
      );
      if (saved.state !== 'pending') return answer('pending', 'refresh_account', saved);
      await tx.billingOperation.update({ where: { id: saved.id }, data: { externalId: session.id } });
      check(typeof session.url === 'string' && new URL(session.url).protocol === 'https:', 'PURCHASE_URL');
      return answer('pending', 'checkout_open', saved, { url: session.url });
    });
  }
  async function associate(operation, session) {
    validateSession(operation, session);
    if (session.status !== 'complete') return answer('pending', 'checkout_unfinished', operation);
    if (session.payment_status === 'unpaid') return answer('pending', 'payment_pending', operation);
    const lines = session.line_items;
    check(
      session.payment_status === 'paid' &&
        Number.isSafeInteger(session.amount_total) &&
        session.amount_total > 0 &&
        session.currency === settings().currency &&
        lines?.has_more === false &&
        lines.data?.length === 1 &&
        lines.data[0].quantity === 1 &&
        id(lines.data[0].price) === settings().priceId &&
        /^cus_[A-Za-z0-9_]+$/.test(id(session.customer)) &&
        /^sub_[A-Za-z0-9_]+$/.test(id(session.subscription)),
      'PURCHASE_COMPLETION'
    );
    const customerId = id(session.customer),
      subId = id(session.subscription);
    const sub = await provider(() => stripe.subscriptions.retrieve(subId));
    check(
      sub?.id === subId &&
        !subscriptionIssue(sub, customerId, settings()) &&
        sub.collection_method === 'charge_automatically',
      'PURCHASE_PLAN'
    );
    return db.$transaction(async (tx) => {
      const state = await locked(tx, operation.userId);
      if (blocked(state)) return help('deletion_pending', operation);
      const saved = await tx.billingOperation.findUnique({ where: { id: operation.id } });
      if (!saved || saved.userId !== operation.userId || saved.activeKey !== key(operation.userId))
        return help('stale_attempt', operation);
      trusted(saved);
      if (saved.externalId && saved.externalId !== session.id) return help('conflicting_session', saved);
      const b = state.binding;
      if (saved.state === 'completed') {
        return b?.customerId === customerId &&
          b.selectedSubscriptionId === subId &&
          saved.externalId === session.id
          ? answer('manage', 'purchase_confirmed', saved)
          : help('stale_attempt', saved);
      }
      if (
        saved.state !== 'pending' ||
        (b?.selectedSubscriptionId || null) !== saved.parameters.previousSelection ||
        (state.user.stripeId || null) !== saved.customerId
      )
        return help('selection_changed', saved);
      const owner = await tx.billingCustomer.findUnique({ where: { customerId } });
      if (owner && (owner.userId !== operation.userId || owner.deletedAt || owner.stripeDeletedAt))
        return help('customer_conflict', saved);
      // No User upsert here: deleted identity is never recreated by completion.
      const data = { selectedSubscriptionId: subId, livemode: settings().livemode };
      if (b?.selectedSubscriptionId !== subId)
        Object.assign(data, cleared, { selectedCanceledAt: sub.status === 'canceled' ? now() : null });
      else if (sub.status === 'canceled') Object.assign(data, cleared, { selectedCanceledAt: now() });
      await tx.billingCustomer.upsert({
        where: { customerId },
        create: { customerId, userId: operation.userId, ...data },
        update: data,
      });
      await tx.user.update({ where: { id: operation.userId }, data: { stripeId: customerId } });
      await tx.billingOperation.update({
        where: { id: saved.id },
        data: { externalId: session.id, state: 'completed', completedAt: now() },
      });
      return answer('manage', 'purchase_confirmed', saved);
    });
  }
  async function inspect(operation) {
    if (!operation.externalId)
      return answer(withinRetryWindow(operation) ? 'pending' : 'help', 'unknown_provider_outcome', operation);
    const session = await retrieve(operation);
    validateSession(operation, session);
    if (session.status === 'complete') return associate(operation, session);
    if (session.status === 'open') return remember(operation, session);
    // An expired session should not have a billable subscription; check any exact ID anyway.
    if (session.subscription) {
      const sub = await provider(() => stripe.subscriptions.retrieve(id(session.subscription)));
      check(
        sub?.id === id(session.subscription) &&
          id(sub.customer) === id(session.customer) &&
          sub.livemode === settings().livemode &&
          subscriptionEnded(sub.status),
        'PURCHASE_EXPIRED_SUBSCRIPTION'
      );
    }
    return answer('purchase', 'checkout_expired', operation);
  }
  async function account(userId) {
    const state = await current(db, userId);
    if (blocked(state)) return answer(state.user.stripeId ? 'manage' : 'help', 'deletion_pending');
    const operation = await db.billingOperation.findUnique({ where: { activeKey: key(userId) } });
    if (operation?.state === 'pending') return inspect(operation);
    const sub = await selected(state.binding);
    if (sub && !subscriptionEnded(sub.status)) return answer('manage', 'ongoing_subscription', operation);
    if (state.user.stripeId && !sub) return help('unresolved_selection', operation);
    return answer('purchase', 'ready', operation);
  }
  async function checkout(userId) {
    const state = await current(db, userId);
    if (blocked(state)) return help('deletion_pending');
    let operation = await db.billingOperation.findUnique({ where: { activeKey: key(userId) } });
    let expiredAttempt = null;
    if (operation?.state === 'pending') {
      if (operation.externalId) {
        const result = await inspect(operation);
        if (result.action !== 'purchase') return result;
        expiredAttempt = operation.id;
      } else if (!withinRetryWindow(operation)) return help('unknown_provider_outcome', operation);
    }
    const sub = await selected(state.binding);
    if (sub && !subscriptionEnded(sub.status)) return answer('manage', 'ongoing_subscription', operation);
    if (state.user.stripeId && !sub) return help('unresolved_selection', operation);
    const previous = operation;
    operation = await db.$transaction(async (tx) => {
      const live = await locked(tx, userId);
      if (blocked(live)) throw failure(409, 'Account deletion is pending');
      check(
        (live.binding?.selectedSubscriptionId || null) === (state.binding?.selectedSubscriptionId || null) &&
          live.user.stripeId === state.user.stripeId,
        'PURCHASE_CHANGED'
      );
      const active = await tx.billingOperation.findUnique({ where: { activeKey: key(userId) } });
      // Another request may have persisted the session ID since our initial read.
      // Only an exact attempt we positively observed expired may be replaced.
      if (active?.state === 'pending' && active.id !== expiredAttempt) return active;
      check((active?.id || null) === (previous?.id || null), 'PURCHASE_CHANGED');
      if (active) await tx.billingOperation.update({ where: { id: active.id }, data: { activeKey: null } });
      const operationId = randomUUID();
      const request = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: settings().priceId, quantity: 1 }],
        success_url: clientOrigin + '/complete-registration?success=true&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: clientOrigin + '/manage-account',
        metadata: { billing_operation: operationId },
        client_reference_id: operationId,
        ...(live.user.stripeId ? { customer: live.user.stripeId } : {}),
      };
      const parameters = {
        version: 2,
        request,
        previousSelection: live.binding?.selectedSubscriptionId || null,
        livemode: settings().livemode,
      };
      return tx.billingOperation.create({
        data: {
          id: operationId,
          kind: 'checkout',
          activeKey: key(userId),
          userId,
          customerId: live.user.stripeId || null,
          parameters,
          digest: digest(parameters),
          createdAt: now(),
        },
      });
    });
    if (operation.externalId) return inspect(operation);
    if (!withinRetryWindow(operation)) return help('unknown_provider_outcome', operation);
    const session = await provider(() =>
      stripe.checkout.sessions.create(trusted(operation), { idempotencyKey: operation.id })
    );
    validateSession(operation, session);
    if (session.status !== 'open') {
      // A same-key retry can return a completed session. Retrieve current fields before association.
      return inspect({ ...operation, externalId: session.id });
    }
    return remember(operation, session);
  }
  async function confirm(userId, suppliedId) {
    if (!sessionId(suppliedId)) throw failure(400, 'Invalid session ID');
    await current(db, userId);
    const rows = await db.billingOperation.findMany({
      where: { userId, kind: 'checkout', externalId: suppliedId },
      take: 2,
    });
    if (rows.length === 1) return inspect(rows[0]);
    // A browser ID is not authority after a lost write. Resolve our retained key first.
    const active = await db.billingOperation.findUnique({ where: { activeKey: key(userId) } });
    if (!active || active.externalId) throw failure(403, 'Account access denied');
    await checkout(userId);
    const recovered = await db.billingOperation.findUnique({ where: { id: active.id } });
    if (recovered.externalId !== suppliedId) throw failure(403, 'Account access denied');
    return inspect(recovered);
  }
  async function portal(userId) {
    const { user, binding } = await current(db, userId);
    if (!user.stripeId || !binding || binding.deletedAt || binding.stripeDeletedAt)
      return help('no_customer');
    const session = await provider(() =>
      stripe.billingPortal.sessions.create({
        customer: binding.customerId,
        return_url: clientOrigin + '/manage-account',
      })
    );
    check(
      typeof session.url === 'string' && new URL(session.url).protocol === 'https:',
      'PURCHASE_PORTAL_URL'
    );
    return answer('manage', 'portal_open', null, { url: session.url });
  }
  async function processEvent(event) {
    if (event?.type !== 'checkout.session.completed') return access.processEvent(event);
    check(
      event.object === 'event' &&
        /^evt_[A-Za-z0-9_]+$/.test(event.id) &&
        stripeDate(event.created) &&
        event.api_version === API_VERSION &&
        event.livemode === settings().livemode &&
        event.data?.object?.object === 'checkout.session' &&
        event.data.object.livemode === settings().livemode,
      'PURCHASE_EVENT'
    );
    const object = event.data.object;
    const operation =
      typeof object.metadata?.billing_operation === 'string' &&
      (await db.billingOperation.findUnique({ where: { id: object.metadata.billing_operation } }));
    if (!operation || operation.kind !== 'checkout' || !operation.userId) return;
    if (!(await db.user.findUnique({ where: { id: operation.userId } }))) return;
    trusted(operation);
    const session = await provider(() =>
      stripe.checkout.sessions.retrieve(object.id, { expand: ['line_items'] })
    );
    await associate(operation, session);
  }
  return {
    register,
    account: safe(account),
    checkout: safe(checkout),
    confirm: safe(confirm),
    portal: safe(portal),
    processEvent: safe(processEvent),
  };
}
module.exports = { createPurchase };
