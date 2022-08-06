const express = require('express');
const userRouter = require('./users');
const authRouter = require('./auth');

const v1Router = express.Router();

v1Router.use('/users', userRouter);
v1Router.use('/auth', authRouter);

module.exports = v1Router;