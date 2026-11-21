const assert = require("node:assert/strict");
const { test, before, beforeEach, after, mock } = require("node:test");
const createFixture = require("./support/identity-http");
const { createSupport } = require("../support/service");

const message = {
  name: "Synthetic Listener",
  email: "reply@example.invalid",
  message: "Please help with my account",
};
let fixture;
let logs = [];

before(async () => {
  mock.method(console, "error", (...args) => logs.push(args));
  fixture = await createFixture();
});

beforeEach(async () => {
  await fixture.reset();
  logs = [];
});

after(async () => {
  if (fixture) await fixture.close();
});

test("anonymous support uses the fixed backend recipient, plaintext and validated reply-to", async () => {
  const result = await fixture.json("support", message, undefined, {
    Origin: fixture.config.clientOrigin,
  });
  assert.equal(result.status, 202);
  assert.deepEqual(result.body, { accepted: true });
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal(result.cookie, undefined);
  assert.deepEqual(fixture.supportMail, [
    {
      from: "login@example.invalid",
      to: ["support@example.invalid"],
      reply_to: message.email,
      subject: "Roop Verma Library support request",
      text: "Name: Synthetic Listener\nEmail: reply@example.invalid\n\nPlease help with my account",
    },
  ]);
  assert.deepEqual(logs, []);
});

test("origin and CSRF rejection happen before mail or rate-counter work", async () => {
  assert.equal(
    (
      await fixture.json("support", message, undefined, {
        Origin: "https://wrong.example.invalid",
      })
    ).status,
    403
  );
  assert.equal(
    (
      await fixture.request("support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
    ).status,
    403
  );
  assert.deepEqual(fixture.calls, []);
  assert.equal(fixture.supportMail.length, 0);
});

for (const [name, body] of [
  ["missing fields", {}],
  ["array", []],
  ["null", null],
  ["arbitrary recipient", { ...message, to: "other@example.invalid" }],
  ["arbitrary sender", { ...message, from: "other@example.invalid" }],
  ["arbitrary HTML", { ...message, html: "<p>untrusted</p>" }],
  ["blank name", { ...message, name: " " }],
  ["long name", { ...message, name: "x".repeat(101) }],
  [
    "header-like name",
    { ...message, name: "Name\r\nBCC: other@example.invalid" },
  ],
  ["invalid email", { ...message, email: "not-an-address" }],
  [
    "header injection",
    { ...message, email: "reply@example.invalid\r\nBCC:other@example.invalid" },
  ],
  ["blank message", { ...message, message: " " }],
  ["long message", { ...message, message: "x".repeat(5001) }],
  ["control bytes", { ...message, message: "text\0text" }],
]) {
  test(
    "support rejects " +
      name +
      " without sending or persisting contact content",
    async () => {
      assert.equal((await fixture.json("support", body)).status, 400);
      assert.equal(fixture.supportMail.length, 0);
      assert.deepEqual(fixture.calls, []);
    }
  );
}

test("concurrent anonymous support requests enforce the persisted per-IP limit", async () => {
  const results = await Promise.all(
    Array.from({ length: 10 }, () => fixture.json("support", message))
  );
  assert.equal(results.filter((result) => result.status === 202).length, 5);
  assert.equal(results.filter((result) => result.status === 429).length, 5);
  assert.equal(fixture.supportMail.length, 5);
  assert.ok(
    results
      .filter((result) => result.status === 429)
      .every((result) => result.headers.get("retry-after") === "900")
  );
  fixture.advance(15 * 60 * 1000);
  assert.equal((await fixture.json("support", message)).status, 202);
});

test("the global support limit also applies across distinct IP buckets", async () => {
  let sends = 0;
  const support = createSupport({
    identity: fixture.identity,
    config: fixture.config,
    recipient: "support@example.invalid",
    transport: async () => {
      sends++;
      return { ok: true, json: async () => ({ id: "synthetic" }) };
    },
  });
  for (let index = 0; index < 20; index++)
    await support.send(message, "synthetic-ip-" + index);
  await assert.rejects(
    support.send(message, "synthetic-ip-overflow"),
    (error) => error.status === 429
  );
  assert.equal(sends, 20);
});

test("provider failures remain uncertain and never expose message content, addresses or provider errors", async () => {
  fixture.failSupport();
  const result = await fixture.json("support", message);
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, {
    error: { message: "Request could not be completed" },
  });
  assert.equal(result.headers.get("cache-control"), "no-store");
  const output = JSON.stringify(logs);
  for (const privateValue of [
    message.name,
    message.email,
    message.message,
    "synthetic private support provider payload",
    "synthetic-mail-key",
  ])
    assert.ok(!output.includes(privateValue));
  assert.equal(logs.length, 1);
  assert.ok(output.includes("POST /api/v1/support/"));
});

test("missing recipient or unavailable rate storage fails closed before any provider work", async () => {
  let sends = 0;
  const transport = async () => {
    sends++;
  };
  const unconfigured = createSupport({
    identity: fixture.identity,
    config: fixture.config,
    transport,
  });
  await assert.rejects(
    unconfigured.send(message, "synthetic-ip"),
    (error) => error.status === 503
  );
  const unavailable = createSupport({
    identity: {
      limit: async () => {
        throw Error("synthetic storage failure");
      },
    },
    config: fixture.config,
    recipient: "support@example.invalid",
    transport,
  });
  await assert.rejects(unavailable.send(message, "synthetic-ip"));
  assert.equal(sends, 0);
});

for (const response of [
  { ok: false },
  { ok: true, json: async () => ({}) },
  { ok: true, json: async () => ({ id: "" }) },
]) {
  test("support requires successful explicit provider acceptance", async () => {
    const support = createSupport({
      identity: fixture.identity,
      config: fixture.config,
      recipient: "support@example.invalid",
      transport: async () => response,
    });
    await assert.rejects(
      support.send(message, "synthetic-ip"),
      (error) => error.status === 503
    );
  });
}

test("Resend request uses the fixed origin, credentials, timeout signal and no redirects", async () => {
  let captured;
  const support = createSupport({
    identity: fixture.identity,
    config: fixture.config,
    recipient: "support@example.invalid",
    transport: async (url, request) => {
      captured = { url, request };
      return { ok: true, json: async () => ({ id: "synthetic" }) };
    },
  });
  await support.send(
    { ...message, message: "<b>literal text</b>\nSecond line" },
    "synthetic-ip"
  );
  assert.equal(captured.url, "https://api.resend.com/emails");
  assert.equal(
    captured.request.headers.Authorization,
    "Bearer synthetic-mail-key"
  );
  assert.equal(captured.request.redirect, "error");
  assert.ok(captured.request.signal instanceof AbortSignal);
  const payload = JSON.parse(captured.request.body);
  assert.ok(payload.text.includes("<b>literal text</b>\nSecond line"));
  assert.equal(payload.html, undefined);
});
