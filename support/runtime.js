const { identity, config } = require("../identity/runtime");

module.exports = require("./service").createSupport({
  identity,
  config,
  recipient: process.env.SUPPORT_EMAIL_TO,
});
