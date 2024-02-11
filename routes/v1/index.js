const express = require('express');
const userRouter = require('./user');
const authRouter = require('./auth');
const paymentRouter = require('./payments');
const trackRouter = require('./track');
const locationRouter = require('./location');
const eventRouter = require('./event');
const tapeRouter = require('./tape');
const ragaRouter = require('./raga');
const artistRouter = require('./artist');
const tributeRouter = require('./tribute');
const networkErrorRouter = require('./networkError');
const mediaTypeRouter = require('./mediaType');

const v1Router = express.Router();

v1Router.use('/artist', artistRouter);
v1Router.use('/raga', ragaRouter);
v1Router.use('/tape', tapeRouter);
v1Router.use('/event', eventRouter);
v1Router.use('/location', locationRouter);
v1Router.use('/user', userRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/payment', paymentRouter);
v1Router.use('/track', trackRouter);
v1Router.use('/tribute', tributeRouter);
v1Router.use('/network-error', networkErrorRouter);
v1Router.use('/media-type', mediaTypeRouter);

module.exports = v1Router;
