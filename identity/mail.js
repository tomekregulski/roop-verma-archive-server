// Never log provider bodies, recipients or credentials.
module.exports = function createMailer(config, transport = fetch) {
  return async function sendLoginEmail({ to, link }) {
    const response = await transport('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.emailFrom, to: [to], subject: 'Your Roop Verma Library login link',
        text: `Use this link to log in within 15 minutes:\n${link}\n\nThis link works once. If you did not request it, ignore this email.`,
      }),
      signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    if (!response.ok) throw new Error('Email delivery was not accepted');
    const data = await response.json();
    if (!data || typeof data.id !== 'string' || !data.id) throw new Error('Invalid email provider response');
    // Provider acceptance is not evidence of inbox delivery.
  };
};
