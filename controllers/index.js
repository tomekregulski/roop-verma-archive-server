const router = require('express').Router();
const artistRoutes = require('./artistRoutes');
const locationRoutes = require('./locationRoutes');
const performanceTypeRoutes = require('./performanceTypeRoutes');
const ragaRoutes = require('./ragaRoutes');
const tapeRoutes = require('./tapeRoutes');
const trackRoutes = require('./trackRoutes');
const userRoutes = require('./userRoutes');

router.use('/api/artists', artistRoutes);
router.use('/api/locations', locationRoutes);
router.use('/api/performance-types', performanceTypeRoutes);
router.use('/api/ragas', ragaRoutes);
router.use('/api/tapes', tapeRoutes);
router.use('/api/tracks', trackRoutes);
router.use('/api/users', userRoutes);

module.exports = router;
