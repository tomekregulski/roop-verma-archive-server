const { emailAddress, failure } = require("../identity/service");

/** Accept only bounded contact fields; callers cannot choose delivery headers. */
function supportMessage(body) {
  if (
    !body ||
    Array.isArray(body) ||
    typeof body !== "object" ||
    Object.keys(body).length !== 3 ||
    Object.keys(body).some(
      (key) => !["name", "email", "message"].includes(key)
    ) ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.length > 100 ||
    /[\x00-\x1f\x7f]/.test(body.name) ||
    typeof body.message !== "string" ||
    !body.message.trim() ||
    body.message.length > 5000 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(body.message)
  ) {
    throw failure(
      400,
      "Provide a name, email and message within the allowed lengths"
    );
  }
  return {
    name: body.name.trim(),
    email: emailAddress(body.email),
    message: body.message.trim(),
  };
}

/** Reuse Resend and persisted identity rate counters without storing support content. */
function createSupport({ identity, config, recipient, transport = fetch }) {
  let to;
  try {
    to = emailAddress(recipient);
  } catch {
    to = null;
  }

  /** Send anonymously to one operator-configured inbox; acceptance is not delivery. */
  async function send(body, ip) {
    if (!to) throw failure(503, "Support is temporarily unavailable");
    const message = supportMessage(body);
    await identity.limit("support-ip", ip, 5, 15 * 60 * 1000);
    await identity.limit("support-global", "all", 20, 15 * 60 * 1000);
    try {
      const response = await transport("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.emailFrom,
          to: [to],
          reply_to: message.email,
          subject: "Roop Verma Library support request",
          text: `Name: ${message.name}\nEmail: ${message.email}\n\n${message.message}`,
        }),
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      if (!response.ok) throw Error("Provider rejected support message");
      const accepted = await response.json();
      if (typeof accepted?.id !== "string" || !accepted.id)
        throw Error("Provider acceptance missing");
    } catch {
      // Never propagate provider errors, message content, addresses or credentials.
      throw failure(503, "Support message could not be confirmed");
    }
    return { accepted: true };
  }

  return { send };
}

module.exports = { createSupport, supportMessage };
