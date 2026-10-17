const { PrismaClient } = require('@prisma/client');
const config = require('./config')();
const db = new PrismaClient();
const identity = require('./service').createIdentity({ db, config, sendEmail: require('./mail')(config) });
module.exports = { db, config, identity };
