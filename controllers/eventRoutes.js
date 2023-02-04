const router = require('express').Router();
const { Event, Location } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allEvents = await Event.findAll({
      include: {
        model: Location,
        as: 'Location',
      },
    });
    const eventsData = allEvents.map((artist) => artist.get({ plain: true }));
    res.status(200).json(eventsData);
  } catch (err) {
    console.log('Events get: ', err);
    res.status(500).json(err);
  }
});

module.exports = router;
