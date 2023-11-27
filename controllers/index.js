const router = require('express').Router();
const artistRoutes = require('./artistRoutes');
const locationRoutes = require('./locationRoutes');
const ragaRoutes = require('./ragaRoutes');
const tapeRoutes = require('./tapeRoutes');
const trackRoutes = require('./trackRoutes');
// const userRoutes = require('./userRoutes');
const paymentRuotes = require('./paymentRoutes');
const eventRoutes = require('./eventRoutes');

router.use('/api/artists', artistRoutes);
router.use('/api/locations', locationRoutes);
router.use('/api/ragas', ragaRoutes);
router.use('/api/tapes', tapeRoutes);
router.use('/api/tracks', trackRoutes);
// router.use('/api/users', userRoutes);
router.use('/api/payments', paymentRuotes);
router.use('/api/events', eventRoutes);

module.exports = router;
